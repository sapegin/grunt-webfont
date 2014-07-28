/**
 * SVG to webfont converter for Grunt
 *
 * @requires ttfautohint
 * @author Artem Sapegin (http://sapegin.me)
 */

module.exports = function(grunt) {
	'use strict';

	var fs = require('fs');
	var path = require('path');
	var async = require('async');
	var glob = require('glob');
	var chalk = require('chalk');
	var mkdirp = require('mkdirp');
	var _ = require('lodash');
	var _s = require('underscore.string');
	var wf = require('./util/util');


	grunt.registerMultiTask('webfont', 'Compile separate SVG files to webfont', function() {
		['src', 'dest'].forEach(function(name) {
			this.requiresConfig([this.name, this.target, name].join('.'));
		}.bind(this));

		var allDone = this.async();
		var params = this.data;
		var options = params.options || {};

		/**
		 * Winston to Grunt logger adapter.
		 */
		var logger = {
			warn: function() {
				grunt.log.warn.apply(null, arguments);
			},
			error: function() {
				grunt.warn.apply(null, arguments);
			},
			log: function() {
				grunt.log.writeln.apply(null, arguments);
			},
			verbose: function() {
				grunt.verbose.writeln.apply(null, arguments);
			}
		};

		if (options.skip) {
			allDone();
			return;
		}

		// Source files
		var files = _.filter(this.filesSrc, isSvgFile);
		if (!files.length) {
			logger.warn('Specified empty list of source SVG files.');
		}

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
			types: optionToArray(options.types, wf.fontFormats),
			order: optionToArray(options.order, wf.fontFormats),
			embed: options.embed === true ? ['woff'] : optionToArray(options.embed, false),
			rename: options.rename || path.basename,
			engine: options.engine || 'fontforge',
			autoHint: options.autoHint !== false,
			codepoints: options.codepoints,
			startCodepoint: options.startCodepoint || wf.UNICODE_PUA_START,
			ie7: options.ie7 === true,
			normalize: options.normalize !== false,
			logger: logger,
			fontHeight: options.fontHeight || 512,
			descent: options.descent || 64,
			ascent: options.ascent || 448
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

		// “Rename” files
		o.glyphs = o.files.map(function(file) {
			return o.rename(file).replace(path.extname(file), '');
		});

		// Check or generate codepoints
		// @todo Codepoint can be a Unicode code or character.
		var currentCodepoint = o.startCodepoint;
		if (!o.codepoints) o.codepoints = {};
		o.glyphs.forEach(function(name) {
			if (!o.codepoints[name]) {
				o.codepoints[name] = getNextCodepoint();
			}
		});

		// Run!
		async.waterfall([
			createOutputDirs,
			cleanOutputDir,
			generateFont,
			generateStylesheet,
			generateDemoHtml,
			printDone
		], allDone);


		/**
		 * Create output directory
		 *
		 * @param {Function} done
		 */
		function createOutputDirs(done) {
			mkdirp.sync(o.destCss);
			mkdirp.sync(o.dest);
			done();
		}

		/**
		 * Clean output directory
		 *
		 * @param {Function} done
		 */
		function cleanOutputDir(done) {
			var htmlDemoFileMask = path.join(o.destCss, o.fontBaseName + '*.{' + o.stylesheet + ',html}');
			var files = glob.sync(htmlDemoFileMask).concat(generatedFontFiles());
			async.forEach(files, function(file, next) {
				fs.unlink(file, next);
			}, done);
		}

		/**
		 * Generate font using selected engine
		 *
		 * @param {Function} done
		 */
		function generateFont(done) {
			var engine = require('./engines/' + o.engine);
			engine(o, function(result) {
				if (result === false) {
					// Font was not created, exit
					allDone();
				}

				if (result) {
					o = _.extend(o, result);
				}

				done();
			});
		}

		/**
		 * Generate CSS
		 *
		 * @param {Function} done
		 */
		function generateStylesheet(done) {
			// Relative fonts path
			if (!o.relativeFontPath) {
				o.relativeFontPath = path.relative(o.destCss, o.dest);
			}
			o.relativeFontPath = normalizePath(o.relativeFontPath);

			// Generate font URLs to use in @font-face
			var fontSrcs = [[], []];
			o.order.forEach(function(type) {
				if (!has(o.types, type)) return;
				wf.fontsSrcsMap[type].forEach(function(font, idx) {
					if (font) {
						fontSrcs[idx].push(generateFontSrc(type, font));
					}
				});
			});

			// Convert them to strings that could be used in CSS
			var fontSrcSeparator = option(wf.fontSrcSeparators, o.stylesheet);
			fontSrcs.forEach(function(font, idx) {
				// o.fontSrc1, o.fontSrc2
				o['fontSrc'+(idx+1)] = font.join(fontSrcSeparator);
			});

			// Convert codepoints to array of strings
			var codepoints = [];
			_.each(o.glyphs, function(name) {
				codepoints.push(o.codepoints[name].toString(16));
			});
			o.codepoints = codepoints;

			// Prepage glyph names to use as CSS classes
			o.glyphs = _.map(o.glyphs, classnameize);

			// Read JSON file corresponding to CSS template
			var templateJson = readTemplate(o.template, o.syntax, '.json', true);
			if (templateJson) o = _.extend(o, JSON.parse(templateJson.template));

			// Now override values with templateOptions
			if (o.templateOptions) o = _.extend(o, o.templateOptions);

			// Generate CSS
			o.cssTemplate = readTemplate(o.template, o.syntax, '.css');
			var cssFilePrefix = option(wf.cssFilePrefixes, o.stylesheet);
			var cssFile = path.join(o.destCss, cssFilePrefix + o.fontBaseName + '.' + o.stylesheet);
			var cssContext = _.extend(o, {
				iconsStyles: true
			});

			var css = renderTemplate(o.cssTemplate, cssContext);

			// Fix CSS preprocessors comments: single line comments will be removed after compilation
			if (has(['sass', 'scss', 'less', 'styl'], o.stylesheet)) {
				css = css.replace(/\/\* *(.*?) *\*\//g, '// $1');
			}

			// Save file
			fs.writeFileSync(cssFile, css);

			done();
		}

		/**
		 * Generate HTML demo page
		 *
		 * @param {Function} done
		 */
		function generateDemoHtml(done) {
			if (!o.htmlDemo) return done();

			// HTML should not contain relative paths
			// If some styles was not included in CSS we should include them in HTML to properly render icons
			var relativeRe = new RegExp(_s.escapeRegExp(o.relativeFontPath), 'g');
			var htmlRelativeFontPath = normalizePath(path.relative(o.destHtml, o.dest));
			var context = _.extend(o, {
				fontSrc1: o.fontSrc1.replace(relativeRe, htmlRelativeFontPath),
				fontSrc2: o.fontSrc2.replace(relativeRe, htmlRelativeFontPath),
				fontfaceStyles: true,
				baseStyles: true,
				extraStyles: false,
				iconsStyles: true,
				stylesheet: 'css'
			});
			var htmlStyles = renderTemplate(o.cssTemplate, context);
			var htmlContext = _.extend(context, {
				styles: htmlStyles
			});

			// Generate HTML
			var demoTemplate = readTemplate(o.htmlDemoTemplate, 'demo', '.html');
			var demoFile = path.join(o.destHtml, o.fontBaseName + '.html');
			var demo = renderTemplate(demoTemplate, htmlContext);

			// Save file
			fs.writeFileSync(demoFile, demo);

			done();
		}

		/**
		 * Print log
		 *
		 * @param {Function} done
		 */
		function printDone(done) {
			logger.log('Font ' + chalk.cyan(o.fontName) + ' with ' + o.glyphs.length + ' glyphs created.');
			done();
		}


		/**
		 * Helpers
		 */

		/**
		 * Convert a string of comma seperated words into an array
		 *
		 * @param {String} val Input string
		 * @param {String} defVal Default value
		 * @return {Array}
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

		/**
		 * Check if a value exists in an array
		 *
		 * @param {Array} haystack Array to find the needle in
		 * @param {Mixed} needle Value to find
		 * @return {Boolean} Needle was found
		 */
		function has(haystack, needle) {
			return haystack.indexOf(needle) !== -1;
		}

		/**
		 * Return a specified option if it exists in an object or `_default` otherwise
		 *
		 * @param {Object} map Options object
		 * @param {String} key Option to find in the object
		 * @return {Mixed}
		 */
		function option(map, key) {
			if (key in map) {
				return map[key];
			}
			else {
				return map._default;
			}
		}

		/**
		 * Find next unused codepoint.
		 *
		 * @return {Integer}
		 */
		function getNextCodepoint() {
			while (_.contains(o.codepoints, currentCodepoint)) {
				currentCodepoint++;
			}
			return currentCodepoint;
		}

		/**
		 * Check whether file is SVG or not
		 *
		 * @param {String} filepath File path
		 * @return {Boolean}
		 */
		function isSvgFile(filepath) {
			return path.extname(filepath).toLowerCase() === '.svg';
		}

		/**
		 * Convert font file to data:uri and remove source file
		 *
		 * @param {String} fontFile Font file path
		 * @return {String} Base64 encoded string
		 */
		function embedFont(fontFile) {
			// Convert to data:uri
			var dataUri = fs.readFileSync(fontFile, 'base64');
			var type = path.extname(fontFile).substring(1);
			var fontUrl = 'data:application/x-font-' + type + ';charset=utf-8;base64,' + dataUri;

			// Remove font file
			fs.unlinkSync(fontFile);

			return fontUrl;
		}

		/**
		 * Append a slash to end of a filepath if it not exists and make all slashes forward
		 *
		 * @param {String} filepath File path
		 * @return {String}
		 */
		function normalizePath(filepath) {
			if (!filepath.length) return filepath;

			// Make all slashes forward
			filepath = filepath.replace(/\\/g, '/');

			// Make sure path ends with a slash
			if (!_s.endsWith(filepath, '/')) {
				filepath += '/';
			}

			return filepath;
		}

		/**
		 * Generate URL for @font-face
		 *
		 * @param {String} type Type of font
		 * @param {Object} font URL or Base64 string
		 * @return {String}
		 */
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

		/**
		 * Reat the template file
		 *
		 * @param {String} template Template file path
		 * @param {String} syntax Syntax (bem, bootstrap, etc.)
		 * @param {String} ext Extention of the template
		 * @return {Object} {filename: 'Template filename', template: 'Template code'}
		 */
		function readTemplate(template, syntax, ext, optional) {
			var filename = template
				? path.resolve(template.replace(/\.[^\\\/.]+$/, '') + ext)
				: path.join(__dirname, 'templates/' + syntax + ext)
			;
			if (fs.existsSync(filename)) {
				return {
					filename: filename,
					template: fs.readFileSync(filename, 'utf8')
				};
			}
			else if (!optional) {
				return grunt.fail.fatal('Cannot find template at path: ' + filename);
			}
		}

		/**
		 * Render template with error reporting
		 *
		 * @param {Object} template {filename: 'Template filename', template: 'Template code'}
		 * @param {Object} context Template context
		 * @return {String}
		 */
		function renderTemplate(template, context) {
			try {
				return _.template(template.template, context);
			}
			catch (e) {
				grunt.fail.fatal('Error while rendering template ' + template.filename + ': ' + e.message);
			}
		}

		/**
		 * Return list of generated font files
		 *
		 * @return {Array}
		 */
		function generatedFontFiles() {
			return glob.sync(path.join(o.dest, o.fontBaseName + wf.fontFileMask));
		}

		/**
		 * Basic template function: replaces {variables}
		 *
		 * @param {Template} tmpl Template code
		 * @param {Object} context Values object
		 * @return {String}
		 */
		function template(tmpl, context) {
			return tmpl.replace(/\{([^\}]+)\}/g, function(m, key) {
				return context[key];
			});
		}

		/**
		 * Prepare string to use as CSS class name
		 *
		 * @param {String} str
		 * @return {String}
		 */
		function classnameize(str) {
			return _s.trim(str).replace(/\s+/g, '-');
		}
	});
};
