'use strict';

var fs = require('fs'),
	path = require('path'),
	grunt = require('grunt');

exports.webfont = {
	test1: function(test) {
		// All out files should be created and should not be empty
		'woff,ttf,eot,svg,css,html'.split(',').forEach(function(type) {
			var name = type.toUpperCase();
			test.ok(fs.existsSync('test/tmp/icons.' + type), name + ' file created.');
			test.ok(grunt.file.read('test/tmp/icons.' + type).length, name + ' file not empty.');
		});

		var svgs = grunt.file.expand('test/src/**.*'),
			css = grunt.file.read('test/tmp/icons.css');

		// Every SVG file should have corresponding entry in CSS file
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg'),
				found = css.match('\\.icon_' + id + ':before');
			test.ok(!!found, 'Icon ' + id + ' shound be in CSS file.');
		});

		test.done();
	},

	test2: function(test) {
		// Read hash
		var hash = grunt.file.expand('test/tmp/myfont-*.woff');
		hash = path.basename(hash, '.woff').replace('myfont-', '');

		// All out files should be created and should not be empty
		'woff,svg'.split(',').forEach(function(type) {
			var name = type.toUpperCase(),
				prefix = 'test/tmp/myfont-' + hash + '.';
			test.ok(fs.existsSync(prefix + type), name + ' file created.');
			test.ok(grunt.file.read(prefix + type).length, name + ' file not empty.');
		});
		'css,html'.split(',').forEach(function(type) {
			var name = type.toUpperCase();
			test.ok(fs.existsSync('test/tmp/myfont.' + type), name + ' file created.');
			test.ok(grunt.file.read('test/tmp/myfont.' + type).length, name + ' file not empty.');
		});

		// Excluded file types should not be created
		'eot,ttf'.split(',').forEach(function(type) {
			var name = type.toUpperCase(),
				prefix = 'test/tmp/myfont-' + hash + '.';
			test.ok(!fs.existsSync(prefix + type), name + ' file NOT created.');
		});

		var svgs = grunt.file.expand('test/src/**.*'),
			css = grunt.file.read('test/tmp/myfont.css');

		// Every SVG file should have corresponding entry in CSS file
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg'),
				found = css.match('\\.icon-' + id + ':before');
			test.ok(!!found, 'Icon ' + id + ' shound be in CSS file.');
		});

		test.done();
	}
};
