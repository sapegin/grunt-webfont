/**
 * SVG to webfont converter for Grunt
 *
 * @requires fontforge, ttf2eot, ttfautohint, sfnt2woff
 * @author Artem Sapegin (http://sapegin.me)
 */

/*jshint node:true, laxbreak:true, latedef:false */
module.exports = function(grunt) {
	'use strict';

	var fs = require('fs');
	var path = require('path');
	var temp = require('temp');
	var async = grunt.util.async;
	var _ = grunt.util._;

	grunt.registerMultiTask('webfont', 'Compile separate SVG files to webfont', function() {
		this.requiresConfig([ this.name, this.target, 'src' ].join('.'));
		this.requiresConfig([ this.name, this.target, 'dest' ].join('.'));

		var allDone = this.async();
		var params = this.data;
		var options = params.options || {};

		if (options.skip) {
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
		var fontBaseName = options.font || 'icons';
		var fontName = fontBaseName;
		var destCss = params.destCss || params.dest;
		var dest = params.dest;
		var relativeFontPath = options.relativeFontPath;
		var addHashes = options.hashes !== false;
		var template = options.template;
		var syntax = options.syntax || 'bem';
		var stylesheet = options.stylesheet || 'css';
		var htmlDemo = (stylesheet === 'css' ? (options.htmlDemo !== false) : false);
		var styles = optionToArray(options.styles, 'font,icon');
		var types = optionToArray(options.types, 'woff,ttf,eot,svg');
		var embed = options.embed === true ? ['woff'] : optionToArray(options.embed, false);
		var fontSrcSeparator = stylesheet === 'styl' ? ', ' : ',\n\t\t';

		var fontfaceStyles = has(styles, 'font');
		var baseStyles = has(styles, 'icon');
		var extraStyles = has(styles, 'extra');

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
				if (addHashes) {
					args.push('--hashes');
				}

				grunt.util.spawn({
					cmd: 'fontforge',
					args: args
				}, function(err, json, code) {
					if (code === 127) {
						grunt.log.errorlns('Please install fontforge and all other requirements.');
						grunt.warn('fontforge not found', code);
					}
					else if (err || json.stderr) {
						// We skip some informations about the bin
						// and the "No glyphs" warning because fontforge shows it when font contains only one glyph
						var notError = /\s?(Copyright|License |with many parts BSD |Executable based on sources from|Library based on sources from|Based on source from git|Warning: Font contained no glyphs)/;
						var lines = (err && err.stderr || json.stderr).split('\n');
						// write lines for verbose mode
						lines.forEach(function(line) {
							if (!line.match(notError)) {
								grunt.warn(line);
								allDone();
							} else {
								grunt.log.writeln("fontforge output ignored: ".grey + line);
							}
						});
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
				if (!relativeFontPath) {
					relativeFontPath = path.relative(destCss, dest);
				}
				if (relativeFontPath.length && relativeFontPath[relativeFontPath.length-1] !== '/') {
					relativeFontPath += '/';
				}

				var fontSrc1 = [];
				var fontSrc2 = [];
				if (has(types, 'eot')) {
					fontSrc1.push('url("' + relativeFontPath + fontName + '.eot")');
					if (has(embed, "eot")) { // was !embed, but this does not make sense to me
						fontSrc2.push('url("' + relativeFontPath + fontName + '.eot?#iefix") format("embedded-opentype")');
					}
				}
				if (has(types, 'woff')) {
					var fontUrl;
					if (has(embed, 'woff')) {
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
					var ttfFontUrl;
					if (has(embed, 'ttf')) {
						var ttfFontFile = path.join(dest, fontName + '.ttf');
						// Convert to data:uri
						var ttfDataUri = fs.readFileSync(ttfFontFile, 'base64');
						ttfFontUrl = 'data:application/x-font-ttf;charset=utf-8;base64,' + ttfDataUri;
						// Remove WOFF file
						fs.unlinkSync(ttfFontFile);
					}
					else {
						ttfFontUrl = '"' + relativeFontPath + ttfFontName + '.ttf"';
					}
					fontSrc2.push('url(' + ttfFontUrl + ') format("truetype")');
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

				var cssContext = {
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

				var cssTemplate = template
					? grunt.file.read(template)
					: fs.readFileSync(path.join(__dirname, 'templates/' + syntax + '.css'), 'utf8');
				var cssFilePrefix = (stylesheet === 'sass' || stylesheet === 'scss' ) ? '_' : '';
				var cssFile = path.join(destCss, cssFilePrefix + fontBaseName + '.' + stylesheet);

				var css = grunt.template.process(cssTemplate, {data: cssContext});

				// Fix CSS preprocessors comments: single line comments will be removed after compilation
				if (has(['sass', 'scss', 'less', 'styl'], stylesheet)) {
					css = css.replace(/\/\* *(.*?) *\*\//g, '// $1');
				}

				grunt.file.write(cssFile, css);

				// Demo HTML
				if (htmlDemo) {
					// If some styles was not included in CSS we should include them in HTML to properly render icons
					cssContext = _.extend(cssContext, {
						fontfaceStyles: !fontfaceStyles,
						baseStyles: !baseStyles,
						extraStyles: false,
						iconsStyles: false
					});
					var htmlStyles = grunt.template.process(cssTemplate, {data: cssContext});

					var htmlContext = {
						fontBaseName: fontBaseName,
						glyphs: glyphs,
						baseClass: syntax === 'bem' ? 'icon' : '',
						classPrefix: 'icon' + (syntax === 'bem' ? '_' : '-'),
						styles: htmlStyles
					};
					var demoTemplateFile = path.join(__dirname, 'templates/demo.html');
					var demoFile = path.join(destCss, fontBaseName + '.html');
					var demoTemplate = fs.readFileSync(demoTemplateFile, 'utf8');
					var demo = grunt.template.process(demoTemplate, {data: htmlContext});
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
