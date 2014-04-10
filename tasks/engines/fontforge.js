/**
 * grunt-webfont: fontforge engine
 *
 * @requires fontforge, ttfautohint 1.00+ (optional), eotlitetool.py
 * @author Artem Sapegin (http://sapegin.me)
 */

module.exports = function(o, allDone) {
	'use strict';

	var fs = require('fs');
	var path = require('path');
	var temp = require('temp');
	var async = require('async');
	var glob = require('glob');
	var exec = require('exec');
	var chalk = require('chalk');
	var _ = require('lodash');
	var logger = o.logger || require('winston');
	var wf = require('../util/util');

	// Copy source files to temporary directory
	var tempDir = temp.mkdirSync();
	o.files.forEach(function(file) {
		fs.writeFileSync(path.join(tempDir, o.rename(file)), fs.readFileSync(file));
	});

	// Run Fontforge
	var args = [
		'fontforge',
		'-script',
		path.join(__dirname, 'fontforge/generate.py')
	];

	var proc = exec(args, function(err, out, code) {
		if (err instanceof Error && err.code === 'ENOENT') {
			return error('fontforge not found. Please install fontforge and all other requirements.');
		}
		else if (err) {
			if (err instanceof Error) {
				return error(err.message);
			}

			// Skip some fontforge output such as copyrights. Show warnings only when no font files was created
			// or in verbose mode.
			var success = !!generatedFontFiles();
			var notError = /(Copyright|License |with many parts BSD |Executable based on sources from|Library based on sources from|Based on source from git)/;
			var lines = err.split('\n');

			var warn = [];
			lines.forEach(function(line) {
				if (!line.match(notError) && !success) {
					warn.push(line);
				}
				else {
					logger.verbose(chalk.grey('fontforge: ') + line);
				}
			});

			if (warn.length) {
				return error(warn.join('\n'));
			}
		}

		// Trim fontforge result
		var json = out.replace(/^[^{]+/, '').replace(/[^}]+$/, '');

		// Parse json
		var result;
		try {
			result = JSON.parse(json);
		}
		catch (e) {
			return error('Webfont did not receive a proper JSON result.\n' + e + '\n' + out);
		}

		allDone({
			fontName: path.basename(result.file)
		});
	});

	// Send JSON with params
	if (!proc) return;
	var params = _.extend(o, {
		inputDir: tempDir
	});
	proc.stdin.write(JSON.stringify(params));
	proc.stdin.end();

	function generatedFontFiles() {
		return glob.sync(path.join(o.dest, o.fontBaseName + wf.fontFileMask));
	}

	function error() {
		logger.error.apply(null, arguments);
		allDone(false);
		return false;
	}

};
