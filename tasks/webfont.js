/**
 * SVG to webfont converter for Grunt
 *
 * @requires fontforge, ttf2eot, ttfautohint, sfnt2woff
 * @author Artem Sapegin (http://sapegin.me)
 */

/*jshint node:true, laxbreak:true, latedef:false */
module.exports = function(grunt) {
	'use strict';

	var fs = require('fs'),
		path = require('path'),
		temp = require('temp'),
		async = grunt.util.async;

	grunt.registerMultiTask('webfont', 'Compile separate SVG files to webfont', function() {
		this.requiresConfig([ this.name, this.target, 'src' ].join('.'));
		this.requiresConfig([ this.name, this.target, 'dest' ].join('.'));

		var allDone = this.async(),
			params = this.data;

		params.options = params.options || {};

		if (params.options.skip) {
			allDone();
			return;
		}

		// Source files
		// @todo Check that source files are svg or eps
		var files = grunt.file.expand(params.src);
		if (!files.length) {
			grunt.warn('Source SVG or EPS files not found.');
			allDone();
		}

		// @todo Check that all needed tools installed: fontforge, ttf2eot, ttfautohint, sfnt2woff

		// Options
		var fontBaseName = params.options.font || 'icons',
			fontName = fontBaseName,
			destCss = params.destCss || params.dest,
			dest = params.dest,
			addHashes = params.options.hashes !== false,
			syntax = params.options.syntax || 'bem',
			stylesheet = params.options.stylesheet || 'css',
			htmlDemo = (stylesheet === 'css' ? (params.options.htmlDemo || true) : false),
			styles = optionToArray(params.options.styles, 'font,icon'),
			types = optionToArray(params.options.types, 'woff,ttf,eot,svg');

		var fontfaceStyles = styles.indexOf('font') !== -1,
			baseStyles = styles.indexOf('icon') !== -1,
			extraStyles = styles.indexOf('extra') !== -1;

		var glyphs = [];

		// Create output directory
		grunt.file.mkdir(destCss);
		grunt.file.mkdir(dest);

		// Clean output directory
		grunt.file.expand(path.join(params.destCss, fontBaseName + '*.{' + stylesheet + ',html}'))
			.concat(grunt.file.expand(path.join(params.dest, fontBaseName + '*.{woff,ttf,eot,svg}')))
			.forEach(function(file) {
				fs.unlinkSync(file);
			});

		// Create temporary directory
		var tempDir = temp.mkdirSync();

		async.waterfall([

			// Copy source files to temporary directory
			function(done) {
				async.forEach(files, function(file, next) {
					grunt.file.copy(file, path.join(tempDir, file));
					next();
				}, done);
			},

			// Run Fontforge
			function(done) {
				var args = [
					'-script',
					path.join(__dirname, 'scripts/generate.py'),
					tempDir,
					dest,
					fontBaseName,
					types.join(',')
				];
				if (addHashes) args.push('--hashes');

				grunt.util.spawn({
					cmd: 'fontforge',
					args: args
				}, function(err, json, code) {
					if (err || json.stderr) {
						var lines = (err && err.stderr || json.stderr).split('\n');
						if (lines.length > 3) {
							grunt.warn(lines.pop());
							allDone();
						}
					}

					var result = JSON.parse(json.stdout);
					fontName = path.basename(result.file);
					glyphs = result.names;

					done();
				});
			},

			// Write CSS and HTML
			function(done) {
				// CSS
				var context = {},
					options = {},
					relativeFontPath = path.relative(destCss, dest);

				if (relativeFontPath.length > 0) {
					relativeFontPath += '/';
				}

				var fontSrc = [];
				if (types.indexOf('eot') !== -1)
					fontSrc.push('url("' + relativeFontPath + fontName + '.eot?#iefix") format("embedded-opentype")');
				if (types.indexOf('woff') !== -1)
					fontSrc.push('url("' + relativeFontPath + fontName + '.woff") format("woff")');
				if (types.indexOf('ttf') !== -1)
					fontSrc.push('url("' + relativeFontPath + fontName + '.ttf") format("truetype")');
				if (types.indexOf('svg') !== -1)
					fontSrc.push('url("' + relativeFontPath + fontName + '.svg?#webfont") format("svg")');
				fontSrc = fontSrc.join(',\n\t\t');

				context = {
					relativeFontPath: relativeFontPath,
					fontBaseName: fontBaseName,
					fontName: fontName,
					fontSrc: fontSrc,
					fontfaceStyles: fontfaceStyles,
					baseStyles: baseStyles,
					extraStyles: extraStyles,
					iconsStyles: true,
					glyphs: glyphs
				};

				options.data = context;

				var cssTemplateFile = path.join(__dirname, 'templates/' + syntax + '.css'),
					cssFilePrefix = (stylesheet === 'sass' || stylesheet === 'scss' ) ? '_' : '',
					cssFile = path.join(destCss, cssFilePrefix + fontBaseName + '.' + stylesheet),
					cssTemplate = fs.readFileSync(cssTemplateFile, 'utf8'),
					css = grunt.template.process(cssTemplate, options);
				grunt.file.write(cssFile, css);

				// Demo HTML
				if (htmlDemo) {
					context.fontfaceStyles = !fontfaceStyles;
					context.baseStyles = !baseStyles;
					context.extraStyles = false;
					context.iconsStyles = false;
					context.baseClass = syntax === 'bem' ? 'icon' : '';
					context.classPrefix = 'icon' + (syntax === 'bem' ? '_' : '-');
					context.styles = grunt.template.process(cssTemplate, options);
					var demoTemplateFile = path.join(__dirname, 'templates/demo.html'),
						demoFile = path.join(destCss, fontBaseName + '.html'),
						demoTemplate = fs.readFileSync(demoTemplateFile, 'utf8'),
						demo = grunt.template.process(demoTemplate, options);
					grunt.file.write(demoFile, demo);
				}

				done();
			},

			// Print log
			function(done) {
				grunt.log.writeln("Font '" + fontName + "' with " + glyphs.length + " glyphs created." );
				done();
			}

		], allDone);

	});

	function optionToArray(val, defVal) {
		if (val === undefined) val = defVal;
		if (!val) return [];
		if (typeof val !== 'string') return val;
		if (val.indexOf(',') !== -1) {
			return val.split(',');
		}
		else {
			return [val];
		}
	}

};
