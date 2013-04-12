/*jshint node:true*/
'use strict';

var fs = require('fs'),
	path = require('path'),
	grunt = require('grunt');

exports.webfont = {
	test1: function(test) {
		// All out files should be created and should not be empty
		'woff,ttf,eot,svg'.split(',').forEach(function(type) {
			var name = type.toUpperCase();
			test.ok(fs.existsSync('test/tmp/test1/icons.' + type), name + ' file created.');
			test.ok(grunt.file.read('test/tmp/test1/icons.' + type).length, name + ' file not empty.');
		});

		'css,html'.split(',').forEach(function(type) {
			var name = type.toUpperCase();
			test.ok(fs.existsSync('test/tmp/test1/icons.' + type), name + ' file created.');
			test.ok(grunt.file.read('test/tmp/test1/icons.' + type).length, name + ' file not empty.');
		});

		var svgs = grunt.file.expand('test/src/**.*'),
			css = grunt.file.read('test/tmp/test1/icons.css');

		// CSS links to font files are correct
		'woff,ttf,eot,svg'.split(',').forEach(function(type) {
			var found = css.match('icons.' + type);
			test.ok(!!found, 'File path ' + type + ' shound be in CSS file.');
		});

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
		var hash = grunt.file.expand('test/tmp/test2/fonts/myfont-*.woff');
		hash = path.basename(hash, '.woff').replace('myfont-', '');

		// All out files should be created and should not be empty
		'woff,svg'.split(',').forEach(function(type) {
			var name = type.toUpperCase(),
				prefix = 'test/tmp/test2/fonts/myfont-' + hash + '.';
			test.ok(fs.existsSync(prefix + type), name + ' file created.');
			test.ok(grunt.file.read(prefix + type).length, name + ' file not empty.');
		});
		'css,html'.split(',').forEach(function(type) {
			var name = type.toUpperCase();
			test.ok(fs.existsSync('test/tmp/test2/myfont.' + type), name + ' file created.');
			test.ok(grunt.file.read('test/tmp/test2/myfont.' + type).length, name + ' file not empty.');
		});

		// Excluded file types should not be created
		'eot,ttf'.split(',').forEach(function(type) {
			var name = type.toUpperCase(),
				prefix = 'test/tmp/test2/fonts/myfont-' + hash + '.';
			test.ok(!fs.existsSync(prefix + type), name + ' file NOT created.');
		});

		var svgs = grunt.file.expand('test/src/**.*'),
			css = grunt.file.read('test/tmp/test2/myfont.css');

		// CSS links to font files are correct
		'woff,svg'.split(',').forEach(function(type) {
			var found = css.match('fonts/myfont-' + hash + '.' + type);
			test.ok(!!found, 'File path ' + type + ' shound be in CSS file.');
		});

		// CSS links to excluded formats should not be included
		'ttf,eot'.split(',').forEach(function(type) {
			var found = css.match('fonts/myfont-' + hash + '.' + type);
			test.ok(!found, 'File path ' + type + ' shound be in CSS file.');
		});


		// Every SVG file should have corresponding entry in CSS file
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg'),
				found = css.match('\\.icon-' + id + ':before');
			test.ok(!!found, 'Icon ' + id + ' shound be in CSS file.');
		});

		test.done();
	},

	embed: function(test) {
		// All out files should be created and should not be empty
		'ttf,eot,svg'.split(',').forEach(function(type) {
			var name = type.toUpperCase(),
				prefix = 'test/tmp/embed/icons.';
			test.ok(fs.existsSync(prefix + type), name + ' file created.');
			test.ok(grunt.file.read(prefix + type).length, name + ' file not empty.');
		});

		// WOFF should be deleted
		'woff'.split(',').forEach(function(type) {
			var name = type.toUpperCase(),
				prefix = 'test/tmp/embed/icons.';
			test.ok(!fs.existsSync(prefix + type), name + ' file NOT created.');
		});

		var css = grunt.file.read('test/tmp/embed/icons.css');

		// There should be TWO @font-face declarations
		var m = css.match(/@font-face/g);
		test.equal(m.length, 2, 'Two @font-face declarations.');

		// Data:uri
		m = css.match(/data:application\/x-font-woff;charset=utf-8;base64,/g);
		test.equal(m.length, 1, 'Data:uri');

		test.done();
	},

	embed2: function(test) {
		// Excluded file types should not be created + WOFF should be deleted
		'woff,ttf,eot,svg'.split(',').forEach(function(type) {
			var name = type.toUpperCase(),
				prefix = 'test/tmp/embed2/icons.';
			test.ok(!fs.existsSync(prefix + type), name + ' file NOT created.');
		});

		var css = grunt.file.read('test/tmp/embed2/icons.css');
		var m;

		// There should be ONE @font-face declaration
		m = css.match(/@font-face/g);
		test.equal(m.length, 1, 'One @font-face declaration.');

		// Data:uri
		m = css.match(/data:application\/x-font-woff;charset=utf-8;base64,/g);
		test.equal(m.length, 1, 'Data:uri');

		test.done();
	},

	one: function(test) {
		// All out files should be created and should not be empty
		'woff,ttf,eot,svg'.split(',').forEach(function(type) {
			var name = type.toUpperCase();
			test.ok(fs.existsSync('test/tmp/one/icons.' + type), name + ' file created.');
			test.ok(grunt.file.read('test/tmp/one/icons.' + type).length, name + ' file not empty.');
		});

		'css,html'.split(',').forEach(function(type) {
			var name = type.toUpperCase();
			test.ok(fs.existsSync('test/tmp/one/icons.' + type), name + ' file created.');
			test.ok(grunt.file.read('test/tmp/one/icons.' + type).length, name + ' file not empty.');
		});

		var svgs = grunt.file.expand('test/src_one/**.*'),
			css = grunt.file.read('test/tmp/one/icons.css');

		// CSS links to font files are correct
		'woff,ttf,eot,svg'.split(',').forEach(function(type) {
			var found = css.match('icons.' + type);
			test.ok(!!found, 'File path ' + type + ' shound be in CSS file.');
		});

		// Every SVG file should have corresponding entry in CSS file
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg'),
				found = css.match('\\.icon_' + id + ':before');
			test.ok(!!found, 'Icon ' + id + ' shound be in CSS file.');
		});

		test.done();
	},

	template: function(test) {
		var css = grunt.file.read('test/tmp/template/icons.css');

		// There should be comment from custom template
		var m = css.match('Custom template');
		test.equal(m.length, 1, 'Comment from custom template.');

		test.done();
	},

	relative_path: function(test) {
		var css = grunt.file.read('test/tmp/relative_path/icons.css');

		// There should be links to fonts with relative path
		var m = css.match(/\/iamrelative\/icons-/g);
		test.equal(m.length, 5, 'Links to fonts with relative path.');

		test.done();
	},

	less: function(test) {
		test.ok(fs.existsSync('test/tmp/less/icons.less'), 'LESS file created.');
		test.ok(!fs.existsSync('test/tmp/less/icons.css'), 'CSS file not created.');

		var svgs = grunt.file.expand('test/src/**.*');
		var less = grunt.file.read('test/tmp/less/icons.less');

		// There should be comment from custom template
		var m = less.match(/\/\* *(.*?) *\*\//g);
		test.ok(!m, 'No regular CSS comments.');

		// There should be comment from custom template
		m = less.match(/^\/\//gm);
		test.equal(m.length, 3, 'Single line comments.');

		// Every SVG file should have two corresponding entries in CSS file
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg');
			var found = less.match('\\.icon_' + id + ':before');
			test.ok(!!found, 'Icon ' + id + ' shound be in CSS file.');
			var found_mixin = less.match('\\.icon-' + id + ' {\n\t&:before');
			test.ok(!!found_mixin, 'LESS Mixin ' + id + ' shound be in CSS file.');
		});

		test.done();
	},

	stylus_bem: function(test) {
		test.ok(fs.existsSync('test/tmp/stylus_bem/icons.styl'), 'Stylus file created (BEM).');
		test.ok(!fs.existsSync('test/tmp/stylus_bem/icons.css'), 'CSS file not created (BEM).');

		var styl = grunt.file.read('test/tmp/stylus_bem/icons.styl');

		// There should be comment from custom template
		var m = styl.match(/\/\* *(.*?) *\*\//g);
		test.ok(!m, 'No regular CSS comments.');

		// There should be comment from custom template
		m = styl.match(/^\/\//gm);
		test.equal(m.length, 2, 'Single line comments.');

		var stylus = require('stylus');
		var s = stylus(styl);

		s.render(function(err, css) {
			if (err) {
				console.log('Stylus compile error:');
				console.log(err);
			}
			test.ok(!err, 'Stylus file compiled (BEM).');
			test.done();
		});
	},

	stylus_bootstrap: function(test) {
		test.ok(fs.existsSync('test/tmp/stylus_bootstrap/icons.styl'), 'Stylus file created (Bootstrap).');
		test.ok(!fs.existsSync('test/tmp/stylus_bootstrap/icons.css'), 'CSS file not created (Bootstrap).');

		var styl = grunt.file.read('test/tmp/stylus_bootstrap/icons.styl');

		var stylus = require('stylus');
		var s = stylus(styl);

		s.render(function(err, css) {
			if (err) {
				console.log('Stylus compile error:');
				console.log(err);
			}
			test.ok(!err, 'Stylus file compiled (Bootstrap).');
			test.done();
		});
	}

};
