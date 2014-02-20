/**
 * grunt-webfont: fontforge engine
 *
 * @requires fontforge, ttfautohint 0.97+ (optional), eotlitetool.py
 * @author Artem Sapegin (http://sapegin.me)
 */

module.exports = function(grunt, o, allDone) {
	'use strict';

	var path = require('path');
	var temp = require('temp');
	var async = require('async');
	var wf = require('../util/util');

	// @todo Codepoints option.

	// Copy source files to temporary directory
	var tempDir = temp.mkdirSync();
	o.files.forEach(function(file) {
		grunt.file.copy(file, path.join(tempDir, o.rename(file)));
	});

	// Run Fontforge
	var args = [
		'-script',
		path.join(__dirname, 'fontforge/generate.py'),
		tempDir,
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
	if (o.startCodepoint) {
		args.push('--start_codepoint');
		args.push('0x' + o.startCodepoint.toString(16));
	}

	grunt.util.spawn({
		cmd: 'fontforge',
		args: args
	}, function(err, fontforgeProcess, code) {
		if (code === wf.COMMAND_NOT_FOUND) {
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
				allDone(false);
			}
		}

		// Trim fontforge result
		var json = fontforgeProcess.stdout.replace(/^[^{]+/, '').replace(/[^}]+$/, '');

		// Parse json
		var result;
		try {
			result = JSON.parse(json);
		}
		catch (e) {
			grunt.warn('Webfont did not receive a proper JSON result.\n' + e + '\n' + fontforgeProcess.stdout);
		}

		allDone({
			fontName: path.basename(result.file)
		});
	});

	function generatedFontFiles() {
		return grunt.file.expand(path.join(o.dest, o.fontBaseName + wf.fontFileMask));
	}

};
