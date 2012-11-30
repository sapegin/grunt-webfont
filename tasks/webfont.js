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
		async = grunt.utils.async;

	grunt.registerMultiTask('webfont', 'Compile separate SVG files to webfont', function() {
		this.requiresConfig([ this.name, this.target, 'files' ].join('.'));
		this.requiresConfig([ this.name, this.target, 'destDir' ].join('.'));

		var allDone = this.async(),
			params = this.data;

		if (params.skip) {
			allDone();
			return;
		}

		// Source files
		// @todo Check that source files are svg or eps
		var files = grunt.file.expandFiles(params.files);
		if (!files.length) {
			grunt.warn('Source SVG or EPS files not found.');
			allDone();
		}

		// @todo Check that all needed tools installed: fontforge, ttf2eot, ttfautohint, sfnt2woff

		// Options
		var fontBaseName = params.font || 'icons',
			fontName = fontBaseName,
			destDir = params.destDir,
			addHashes = params.hashes !== false,
			stylesheetType = params.stylesheet || 'bem',
			styles = optionToArray(params.styles, 'font,icon'),
			types = optionToArray(params.types, 'woff,ttf,eot,svg');
		
		var fontfaceStyles = styles.indexOf('font') !== -1,
			baseStyles = styles.indexOf('icon') !== -1,
			extraStyles = styles.indexOf('extra') !== -1;

		var glyphs = [];

		// Create output directory
		grunt.file.mkdir(destDir);

		// Clean output directory
		var oldFiles = grunt.file.expandFiles(path.join(params.destDir, fontBaseName + '*.{woff,ttf,eot,svg,css,html}'));
		oldFiles.forEach(function(file) {
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
					destDir,
					fontBaseName,
					types.join(',')
				];
				if (addHashes) args.push('--hashes');

				grunt.utils.spawn({
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
				var context = {
					fontBaseName: fontBaseName,
					fontName: fontName,
					fontfaceStyles: fontfaceStyles,
					baseStyles: baseStyles,
					extraStyles: extraStyles,
					iconsStyles: true,
					glyphs: glyphs
				};
				var cssTemplateFile = path.join(__dirname, 'templates/' + stylesheetType + '.css'),
					cssFile = path.join(destDir, fontBaseName + '.css'),
					cssTemplate = fs.readFileSync(cssTemplateFile, 'utf8'),
					css = grunt.template.process(cssTemplate, context);
				grunt.file.write(cssFile, css);

				// Demo HTML
				context.fontfaceStyles = !fontfaceStyles;
				context.baseStyles = !baseStyles;
				context.extraStyles = false;
				context.iconsStyles = false;
				context.baseClass = stylesheetType === 'bem' ? 'icon' : '';
				context.classPrefix = 'icon' + (stylesheetType === 'bem' ? '_' : '-');
				context.styles = grunt.template.process(cssTemplate, context);
				var demoTemplateFile = path.join(__dirname, 'templates/demo.html'),
					demoFile = path.join(destDir, fontBaseName + '.html'),
					demoTemplate = fs.readFileSync(demoTemplateFile, 'utf8'),
					demo = grunt.template.process(demoTemplate, context);
				grunt.file.write(demoFile, demo);

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
