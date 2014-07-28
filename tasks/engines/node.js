/**
 * grunt-webfont: Node.js engine
 *
 * @requires ttfautohint 1.00+ (optional)
 * @author Artem Sapegin (http://sapegin.me)
 */

module.exports = function(o, allDone) {
	'use strict';

	var fs = require('fs');
	var path = require('path');
	var async = require('async');
	var temp = require('temp');
	var exec = require('exec');
	var _ = require('lodash');
	var StringDecoder = require('string_decoder').StringDecoder;
	var svgicons2svgfont = require('svgicons2svgfont');
	var svg2ttf = require('svg2ttf');
	var ttf2woff = require('ttf2woff');
	var ttf2eot = require('ttf2eot');
	var md5 = require('crypto').createHash('md5');
	var logger = o.logger || require('winston');
	var wf = require('../util/util');

	// @todo Ligatures

	var fonts = {};

	var generators = {
		svg: function(done) {
			var font = '';
			var decoder = new StringDecoder('utf8');
			var stream = svgicons2svgfont(svgFilesToStreams(o.files), {
				fontName: o.fontName,
				fontHeight: o.fontHeight,
				descent: o.descent,
				normalize: o.normalize,
				log: logger.verbose.bind(logger),
				error: logger.error.bind(logger)
			});
			stream.on('data', function(chunk) {
				font += decoder.write(chunk);
			});
			stream.on('end', function() {
				fonts.svg = font;
				if (o.addHashes) {
					md5.update(font);
					o.fontName += '-' + md5.digest('hex');
				}
				done(font);
			});
		},

		ttf: function(done) {
			getFont('svg', function(svgFont) {
				var font = svg2ttf(svgFont, {});
				font = new Buffer(font.buffer);
				autohintTtfFont(font, function(hintedFont) {
					// ttfautohint is optional
					if (hintedFont) {
						font = hintedFont;
					}
					fonts.ttf = font;
					done(font);
				});
			});
		},

		woff: function(done) {
			getFont('ttf', function(ttfFont) {
				var font = ttf2woff(new Uint8Array(ttfFont), {});
				font = new Buffer(font.buffer);
				fonts.woff = font;
				done(font);
			});
		},

		eot: function(done) {
			getFont('ttf', function(ttfFont) {
				var font = ttf2eot(new Uint8Array(ttfFont));
				font = new Buffer(font.buffer);
				fonts.eot = font;
				done(font);
			});
		}
	};

	var steps = [];

	// Font types
	o.types.forEach(function(type) {
		steps.push(createFontWriter(type));
	});

	steps.push(allDone);

	// Run!
	async.waterfall(steps);

	function getFont(type, done) {
		if (fonts[type]) {
			done(fonts[type]);
		}
		else {
			generators[type](done);
		}
	}

	function createFontWriter(type) {
		return function(done) {
			getFont(type, function(font) {
				fs.writeFileSync(getFontPath(type), font);
				done();
			});
		};
	}

	function svgFilesToStreams(files) {
		return files.map(function(file, idx) {
			var name = o.glyphs[idx];
			return {
				codepoint: o.codepoints[name],
				name: name,
				stream: fs.createReadStream(file)
			};
		});
	}

	function autohintTtfFont(font, done) {
		var tempDir = temp.mkdirSync();
		var originalFilepath = path.join(tempDir, 'font.ttf');
		var hintedFilepath = path.join(tempDir, 'hinted.ttf');

		if (!o.autoHint){
			done(false);
			return;
		}
		// Save original font to temporary directory
		fs.writeFileSync(originalFilepath, font);

		// Run ttfautohint
		var args = [
			'ttfautohint',
			'--symbol',
			'--fallback-script=latn',
			'--windows-compatibility',
			'--no-info',
			originalFilepath,
			hintedFilepath
		];

		exec(args, function(err, out, code) {
			if (err) {
				if (err instanceof Error) {
					if (err.code === 'ENOENT') {
						logger.verbose('Hinting skipped, ttfautohint not found.');
						done(false);
						return;
					}
					err = err.message;
				}
				logger.error('Can’t run ttfautohint.\n\n' + err);
				done(false);
				return;
			}

			// Read hinted font back
			var hintedFont = fs.readFileSync(hintedFilepath);
			done(hintedFont);
		});
	}

	function getFontPath(type) {
		return path.join(o.dest, o.fontName + '.' + type);
	}

};
