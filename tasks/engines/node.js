/**
 * grunt-webfont: Node.js engine
 *
 * @requires ttfautohint
 * @author Artem Sapegin (http://sapegin.me)
 */

/*jshint node:true, laxbreak:true, latedef:false */
module.exports = function(grunt, o, done) {
	'use strict';

	var path = require('path');
	var async = require('async');
	var svgicons2svgfont = require('svgicons2svgfont');

	// @todo Append hashes

	var result = {
		fontName: o.fontName,
		glyphs: []
	};

	async.waterfall([
		svgFilesToSvgFont,
		allDone
	]);


	// Convert SVG files to SVG font
	function svgFilesToSvgFont(done) {
		console.log(o.files);
		svgicons2svgfont(o.files, path.join(o.dest, o.fontName + '.svg'), {
			fontName: o.fontName,
			callback: function(glyphs) {
				console.log('done', glyphs);
				result.glyphs = glyphs;
				done();
			}
		});
	}

	// Create TTF font
	// Autohint TTF
	// Create WOFF font
	// Create OTF font


	function allDone() {
		done(result);
	}
};
