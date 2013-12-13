/**
 * SVG to webfont converter for Grunt
 *
 * @requires fontforge, ttfautohint, eotlitetool.py
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

	var COMMAND_NOT_FOUND = 127;

	// @font-face’s src values generation rules
	var fontsSrcsMap = {
		eot: [
			{
				ext: '.eot'
			},
			{
				ext: '.eot?#iefix',
				format: 'embedded-opentype'
			}
		],
		woff: [
			false,
			{
				ext: '.woff',
				format: 'woff',
				embeddable: true
			},
		],
		ttf: [
			false,
			{
				ext: '.ttf',
				format: 'truetype',
				embeddable: true
			},
		],
		svg: [
			false,
			{
				ext: '.svg?#{fontBaseName}',
				format: 'svg'
			},
		]
	};

	// CSS fileaname prefixes: _icons.scss
	var cssFilePrefixes = {
		_default: '',
		sass: '_',
		scss: '_'
	};

	// @font-face’s src parts seperators
	var fontSrcSeparators = {
		_default: ',\n\t\t',
		styl: ', '
	};

	// All font file formats
	var fontFormats = 'eot,woff,ttf,svg';

	// Any font file
	var fontFileMask = '*.{' + fontFormats + '}';


	grunt.registerMultiTask('webfont', 'Compile separate SVG files to webfont', function() {
		['src', 'dest'].forEach(function(name) {
			this.requiresConfig([this.name, this.target, name].join('.'));
		}.bind(this));

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
			grunt.log.writeln('Source SVG or EPS files not found.'.grey);
			allDone();
			return;
		}

		// @todo Check that all needed tools installed: fontforge, ttfautohint

		// Options
		var o = {
			fontBaseName: options.font || 'icons',
			destCss: params.destCss || params.dest,
			dest: params.dest,
			relativeFontPath: options.relativeFontPath,
			addHashes: options.hashes !== false,
			addLigatures: options.ligatures === true,
			template: options.template,
			syntax: options.syntax || 'bem',
			templateOptions: options.templateOptions || {},
			stylesheet: options.stylesheet || 'css',
			htmlDemo: options.htmlDemo !== false,
			htmlDemoTemplate: options.htmlDemoTemplate,
			styles: optionToArray(options.styles, 'font,icon'),
			types: optionToArray(options.types, 'eot,woff,ttf'),
			order: optionToArray(options.order, fontFormats),
			embed: options.embed === true ? ['woff'] : optionToArray(options.embed, false),
			rename: options.rename || path.basename
		};

		o = _.extend(o, {
			fontName: o.fontBaseName,
			destHtml: options.destHtml || o.destCss,
			fontfaceStyles: has(o.styles, 'font'),
			baseStyles: has(o.styles, 'icon'),
			extraStyles: has(o.styles, 'extra'),
			files: files,
			glyphs: []
		});

		// Run!
		async.waterfall([
			createOutputDirs,
			cleanOutputDir,
			copyFilesToTempDir,
			generateFont,
			generateStylesheet,
			generateDemoHtml,
			printDone
		], allDone);


		/**
		 * Font generation steps
		 */

		// Create output directory
		function createOutputDirs(done) {
			grunt.file.mkdir(o.destCss);
			grunt.file.mkdir(o.dest);
			done();
		}

		// Clean output directory
		function cleanOutputDir(done) {
			var htmlDemoFileMask = path.join(o.destCss, o.fontBaseName + '*.{' + o.stylesheet + ',html}');
			var files = grunt.file.expand(htmlDemoFileMask).concat(generatedFontFiles());
			async.forEach(files, function(file, next) {
				fs.unlink(file, next);
			}, done);
		}

		// Copy source files to temporary directory
		function copyFilesToTempDir(done) {
			o.tempDir = temp.mkdirSync();
			async.forEach(o.files, function(file, next) {
				grunt.file.copy(file, path.join(o.tempDir, o.rename(file)));
				next();
			}, done);
		}

		// Run Fontforge
		function generateFont(done) {
			var args = [
				'-script',
				path.join(__dirname, 'scripts/generate.py'),
				o.tempDir,
				o.dest,
				o.fontBaseName,
				o.types.join(',')
			];
			if (o.addHashes) {
				args.push('--hashes');
			}
			if (o.addLigatures) {
				args.push('--ligatures');
			}

			grunt.util.spawn({
				cmd: 'fontforge',
				args: args
			}, function(err, fontforgeProcess, code) {
				if (code === COMMAND_NOT_FOUND) {
					grunt.log.errorlns('Please install fontforge and all other requirements.');
					grunt.warn('fontforge not found', code);
				}
				else if (err || fontforgeProcess.stderr) {
					// Skip some fontforge output such as copyrights. Show warnings only when no font files was created
					// or in verbose mode.
					var success = !!generatedFontFiles();
					var notError = /(Copyright|License |with many parts BSD |Executable based on sources from|Library based on sources from|Based on source from git)/;
					var lines = (err && err.stderr || fontforgeProcess.stderr).split('\n');

					var warn = [];
					lines.forEach(function(line) {
						if (!line.match(notError) && !success) {
							warn.push(line);
						}
						else {
							grunt.verbose.writeln("fontforge: ".grey + line);
						}
					});

					if (warn.length) {
						grunt.warn(warn.join('\n'));
						allDone();
					}
				}

				// Trim fontforge result
				var json = fontforgeProcess.stdout.replace(/^[^{]+/, '').replace(/[^}]+$/, '');

				// Parse json
				var result;
				try {
					result = JSON.parse(json);
				} catch (e) {
					grunt.warn('Webfont did not receive a popper JSON result.\n' + e + '\n' + fontforgeProcess.stdout);
				}

				o.fontName = path.basename(result.file);
				o.glyphs = result.names;

				done();
			});
		}

		// Generate CSS
		function generateStylesheet(done) {
			// Relative fonts path
			if (!o.relativeFontPath) {
				o.relativeFontPath = path.relative(o.destCss, o.dest);
			}
			o.relativeFontPath = appendSlash(o.relativeFontPath);

			// Generate font URLs to use in @font-face
			var fontSrcs = [[], []];
			o.order.forEach(function(type) {
				if (!has(o.types, type)) return;
				fontsSrcsMap[type].forEach(function(font, idx) {
					if (font) {
						fontSrcs[idx].push(generateFontSrc(type, font));
					}
				});
			});

			// Convert them to strings that could be used in CSS
			var fontSrcSeparator = option(fontSrcSeparators, o.stylesheet);
			fontSrcs.forEach(function(font, idx) {
				// o.fontSrc1, o.fontSrc2
				o['fontSrc'+(idx+1)] = font.join(fontSrcSeparator);
			});

			// Prepage glyph names to use as CSS classes
			o.glyphs = _.map(o.glyphs, _.dasherize);

			// Read JSON file corresponding to CSS template
			var templateJson = readTemplate(o.template, o.syntax, '.json');
			if (templateJson) o = _.extend(o, JSON.parse(templateJson));

			// Now override values with templateOptions
			if (o.templateOptions) o = _.extend(o, o.templateOptions);

			// Generate CSS
			o.cssTemplate = readTemplate(o.template, o.syntax, '.css');
			var cssFilePrefix = option(cssFilePrefixes, o.stylesheet);
			var cssFile = path.join(o.destCss, cssFilePrefix + o.fontBaseName + '.' + o.stylesheet);
			var cssContext = _.extend(o, {
				iconsStyles: true
			});

			var css = grunt.template.process(o.cssTemplate, {data: cssContext});

			// Fix CSS preprocessors comments: single line comments will be removed after compilation
			if (has(['sass', 'scss', 'less', 'styl'], o.stylesheet)) {
				css = css.replace(/\/\* *(.*?) *\*\//g, '// $1');
			}

			// Save file
			grunt.file.write(cssFile, css);

			done();
		}

		// Generate HTML demo page
		function generateDemoHtml(done) {
			if (!o.htmlDemo) return done();

			// HTML should not contain relative paths
			// If some styles was not included in CSS we should include them in HTML to properly render icons
			var relativeRe = new RegExp(o.relativeFontPath, 'g');
			var htmlRelativeFontPath = appendSlash(path.relative(o.destHtml, o.dest));
			var context = _.extend(o, {
				fontSrc1: o.fontSrc1.replace(relativeRe, htmlRelativeFontPath),
				fontSrc2: o.fontSrc2.replace(relativeRe, htmlRelativeFontPath),
				fontfaceStyles: true,
				baseStyles: true,
				extraStyles: false,
				iconsStyles: true,
				stylesheet: 'css'
			});
			var htmlStyles = grunt.template.process(o.cssTemplate, {data: context});
			var htmlContext = _.extend(context, {
				styles: htmlStyles
			});

			// Generate HTML
			var demoTemplate = readTemplate(o.htmlDemoTemplate, 'demo', '.html');
			var demoFile = path.join(o.destHtml, o.fontBaseName + '.html');
			var demo = grunt.template.process(demoTemplate, {data: htmlContext});

			// Save file
			grunt.file.write(demoFile, demo);

			done();
		}

		// Print log
		function printDone(done) {
			grunt.log.writeln('Font ' + o.fontName.cyan + ' with ' + o.glyphs.length + ' glyphs created.');
			done();
		}


		/**
		 * Helpers
		 */

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

		function option(map, type) {
			if (type in map) {
				return map[type];
			}
			else {
				return map._default;
			}
		}

		// Convert font file to data:uri and remove source file
		function embedFont(fontFile) {
			// Convert to data:uri
			var dataUri = fs.readFileSync(fontFile, 'base64');
			var type = path.extname(fontFile).substring(1);
			var fontUrl = 'data:application/x-font-' + type + ';charset=utf-8;base64,' + dataUri;

			// Remove font file
			fs.unlinkSync(fontFile);

			return fontUrl;
		}

		function appendSlash(filepath) {
			if (filepath.length && !_.endsWith(filepath, '/')) {
				filepath += '/';
			}
			return filepath;
		}

		// Generate URL for @font-face
		function generateFontSrc(type, font) {
			var filename = template(o.fontName + font.ext, o);

			var url;
			if (font.embeddable && has(o.embed, type)) {
				url = embedFont(path.join(o.dest, filename));
			}
			else {
				url = o.relativeFontPath + filename;
			}

			var src = 'url("' + url + '")';
			if (font.format) src += ' format("' + font.format + '")';

			return src;
		}

		function readTemplate(template, syntax, ext) {
			if (template) {
				var filename = template.replace(/\.[^\\\/.]+$/, '') + ext;
				return grunt.file.read(filename);
			}
			else {
				return fs.readFileSync(path.join(__dirname, 'templates/' + syntax + ext), 'utf8');
			}
		}

		function generatedFontFiles() {
			return grunt.file.expand(path.join(o.dest, o.fontBaseName + fontFileMask));
		}

		function template(tmpl, context) {
			return tmpl.replace(/\{([^\}]+)\}/g, function(m, key) {
				return context[key];
			});
		}
	});
};
