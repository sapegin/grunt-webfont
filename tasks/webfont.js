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
		async = grunt.util.async,
		_ = grunt.util._;

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
		var files = this.filesSrc;
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
			relativeFontPath = params.options.relativeFontPath,
			addHashes = params.options.hashes !== false,
			template = params.options.template,
			syntax = params.options.syntax || 'bem',
			stylesheet = params.options.stylesheet || 'css',
			htmlDemo = (stylesheet === 'css' ? (params.options.htmlDemo !== false) : false),
			styles = optionToArray(params.options.styles, 'font,icon'),
			types = optionToArray(params.options.types, 'woff,ttf,eot,svg'),
			embed = params.options.embed === true,
			fontSrcSeparator = stylesheet === 'styl' ? ', ' : ',\n\t\t';

		var fontfaceStyles = has(styles, 'font'),
			baseStyles = has(styles, 'icon'),
			extraStyles = has(styles, 'extra');

		var glyphs = [];

		// Create output directory
		grunt.file.mkdir(destCss);
		grunt.file.mkdir(dest);

		// Clean output directory
		grunt.file.expand(path.join(destCss, fontBaseName + '*.{' + stylesheet + ',html}'))
			.concat(grunt.file.expand(path.join(dest, fontBaseName + '*.{woff,ttf,eot,svg}')))
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
					if (code === 127) {
						grunt.log.errorlns('Please install fontforge and all other requirements.');
						grunt.warn('fontforge not found', code);
					}
					else if (err || json.stderr) {
						var lines = (err && err.stderr || json.stderr).split('\n');
						if (lines.length > 3) {
							var warning = lines.pop();
							// Skip "No glyphs" warning because fontforge shows it when font contains one glyph
							if (warning !== 'Warning: Font contained no glyphs') {
								grunt.warn(warning);
								allDone();
							}
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
					options = {};

				if (!relativeFontPath) {
					relativeFontPath = path.relative(destCss, dest);
				}
				if (relativeFontPath[relativeFontPath.length-1] !== '/') {
					relativeFontPath += '/';
				}

				var fontSrc1 = [];
				var fontSrc2 = [];
				if (has(types, 'eot')) {
					fontSrc1.push('url("' + relativeFontPath + fontName + '.eot")');
					if (!embed) {
						fontSrc2.push('url("' + relativeFontPath + fontName + '.eot?#iefix") format("embedded-opentype")');
					}
				}
				if (has(types, 'woff')) {
					var fontUrl;
					if (embed) {
						var fontFile = path.join(dest, fontName + '.woff');
						// Convert to data:uri
						var dataUri = fs.readFileSync(fontFile, 'base64');
						fontUrl = 'data:application/x-font-woff;charset=utf-8;base64,' + dataUri;
						// Remove WOFF file
						fs.unlinkSync(fontFile);
					}
					else {
						fontUrl = '"' + relativeFontPath + fontName + '.woff"';
					}
					fontSrc2.push('url(' + fontUrl + ') format("woff")');
				}
				if (has(types, 'ttf')) {
					fontSrc2.push('url("' + relativeFontPath + fontName + '.ttf") format("truetype")');
				}
				if (has(types, 'svg')) {
					fontSrc2.push('url("' + relativeFontPath + fontName + '.svg?#webfont") format("svg")');
				}
				fontSrc1 = fontSrc1.join(fontSrcSeparator);
				fontSrc2 = fontSrc2.join(fontSrcSeparator);

				// Prepage glyph names to use as CSS classes
				glyphs = _.map(glyphs, function(name) {
					return name.replace(/ /g, '-');
				});

				context = {
					relativeFontPath: relativeFontPath,
					fontBaseName: fontBaseName,
					fontName: fontName,
					fontSrc1: fontSrc1,
					fontSrc2: fontSrc2,
					embed: embed,
					eot: has(types, 'eot'),
					fontfaceStyles: fontfaceStyles,
					baseStyles: baseStyles,
					extraStyles: extraStyles,
                    stylesheet: stylesheet,
					iconsStyles: true,
					glyphs: glyphs
				};

				options.data = context;

				var cssTemplate = template
					? grunt.file.read(template)
					: fs.readFileSync(path.join(__dirname, 'templates/' + syntax + '.css'), 'utf8');
				var cssFilePrefix = (stylesheet === 'sass' || stylesheet === 'scss' ) ? '_' : '';
				var cssFile = path.join(destCss, cssFilePrefix + fontBaseName + '.' + stylesheet);

				var css = grunt.template.process(cssTemplate, options);

				// Fix CSS preprocessors comments: single line comments will be removed after compilation
				if (has(['sass', 'scss', 'less', 'styl'], stylesheet)) {
					css = css.replace(/\/\* *(.*?) *\*\//g, '// $1');
				}

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

	function has(haystack, needle) {
		return haystack.indexOf(needle) !== -1;
	}

};
