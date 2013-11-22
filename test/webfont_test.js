/*jshint node:true*/
'use strict';

var fs = require('fs');
var path = require('path');
var grunt = require('grunt');

function find(haystack, needle) {
	return haystack.indexOf(needle) !== -1;
}

exports.webfont = {
	test1: function(test) {
		// All out files should be created and should not be empty
		'woff,ttf,eot'.split(',').forEach(function(type) {
			var name = type.toUpperCase();
			test.ok(fs.existsSync('test/tmp/test1/icons.' + type), name + ' file created.');
			test.ok(grunt.file.read('test/tmp/test1/icons.' + type).length, name + ' file not empty.');
		});

		'css,html'.split(',').forEach(function(type) {
			var name = type.toUpperCase();
			test.ok(fs.existsSync('test/tmp/test1/icons.' + type), name + ' file created.');
			test.ok(grunt.file.read('test/tmp/test1/icons.' + type).length, name + ' file not empty.');
		});

		var svgs = grunt.file.expand('test/src/**.*');
		var css = grunt.file.read('test/tmp/test1/icons.css');
		var html = grunt.file.read('test/tmp/test1/icons.html');

		// CSS links to font files are correct
		'woff,ttf,eot'.split(',').forEach(function(type) {
			test.ok(
				find(css, 'url("icons.' + type),
				'File path ' + type + ' should be in CSS file.'
			);
		});

		// Double EOT (for IE9 compat mode)
		test.ok(
			find(css, 'src:url("icons.eot");'),
			'First EOT declaration.'
		);
		test.ok(
			find(css, 'src:url("icons.eot?#iefix") format("embedded-opentype"),'),
			'Second EOT declaration.'
		);

		// Every SVG file should have corresponding entry in CSS and HTML files
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg');
			test.ok(
				find(css, '.icon_' + id + ':before'),
				'Icon ' + id + ' should be in CSS file.'
			);
			test.ok(
				find(html, '<div class="icons__item" data-name="' + id + '"><i class="icon icon_' + id + '"></i> icon_' + id + '</div>'),
				'Icon ' + id + ' should be in HTML file.'
			);
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

		var svgs = grunt.file.expand('test/src/**.*');
		var css = grunt.file.read('test/tmp/test2/myfont.css');
		var html = grunt.file.read('test/tmp/test2/myfont.html');

		// CSS links to font files are correct
		'woff,svg'.split(',').forEach(function(type) {
			test.ok(
				find(css, 'url("fonts/myfont-' + hash + '.' + type),
				'File path ' + type + ' should be in CSS file.'
			);
		});

		// CSS links to excluded formats should not be included
		'ttf,eot'.split(',').forEach(function(type) {
			test.ok(
				!find(css, 'fonts/myfont-' + hash + '.' + type),
				'File path ' + type + ' should be in CSS file.'
			);
		});


		// Every SVG file should have corresponding entry in CSS and HTML files
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg');
			test.ok(
				find(css, '.icon-' + id + ':before'),
				'Icon ' + id + ' should be in CSS file.'
			);
			test.ok(
				find(html, '<div class="icons__item" data-name="' + id + '"><i class=" icon-' + id + '"></i> icon-' + id + '</div>'),
				'Icon ' + id + ' should be in HTML file.'
			);
		});

		test.done();
	},

	embed: function(test) {
		// All out files should be created and should not be empty
		'ttf,eot'.split(',').forEach(function(type) {
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

		// Data:uri
		var m = css.match(/data:application\/x-font-woff;charset=utf-8;base64,.*?format\("woff"\)/g);
		test.equal(m && m.length, 1, 'WOFF (default) data:uri');

		test.done();
	},

	embed_woff: function(test) {
		// Excluded file types should not be created + WOFF should be deleted
		'woff,ttf,eot'.split(',').forEach(function(type) {
			var name = type.toUpperCase(),
				prefix = 'test/tmp/embed_woff/icons.';
			test.ok(!fs.existsSync(prefix + type), name + ' file NOT created.');
		});

		var css = grunt.file.read('test/tmp/embed_woff/icons.css');
		var m;

		// Data:uri
		m = css.match(/data:application\/x-font-woff;charset=utf-8;base64,.*?format\("woff"\)/g);
		test.equal(m && m.length, 1, 'Data:uri');

		test.done();
	},

	embed_ttf: function(test) {
		// Excluded file types should not be created + TTF should be deleted
		'woff,ttf,eot'.split(',').forEach(function(type) {
			var name = type.toUpperCase(),
				prefix = 'test/tmp/embed_ttf/icons.';
			test.ok(!fs.existsSync(prefix + type), name + ' file NOT created.');
		});

		var css = grunt.file.read('test/tmp/embed_ttf/icons.css');
		var m;

		// Data:uri
		m = css.match(/data:application\/x-font-ttf;charset=utf-8;base64,.*?format\("truetype"\)/g);
		test.equal(m && m.length, 1, 'TrueType data:uri');

		test.done();
	},

	embed_ttf_woff: function(test) {
		// Excluded file types should not be created + TTF should be deleted
		'woff,ttf,eot'.split(',').forEach(function(type) {
			var name = type.toUpperCase(),
				prefix = 'test/tmp/embed_ttf_woff/icons.';
			test.ok(!fs.existsSync(prefix + type), name + ' file NOT created.');
		});

		var css = grunt.file.read('test/tmp/embed_ttf_woff/icons.css');
		var m;

		// Data:uri
		m = css.match(/data:application\/x-font-ttf;charset=utf-8;base64,.*?format\("truetype"\)/g);
		test.equal(m && m.length, 1, 'TrueType data:uri');
		m = css.match(/data:application\/x-font-woff;charset=utf-8;base64,.*?format\("woff"\)/g);
		test.equal(m && m.length, 1, 'WOFF data:uri');

		test.done();
	},

	one: function(test) {
		// All out files should be created and should not be empty
		'woff,ttf,eot'.split(',').forEach(function(type) {
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
		'woff,ttf,eot'.split(',').forEach(function(type) {
			test.ok(
				find(css, 'icons.' + type),
				'File path ' + type + ' should be in CSS file.'
			);
		});

		// Every SVG file should have corresponding entry in CSS file
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg');
			test.ok(
				find(css, '.icon_' + id + ':before'),
				'Icon ' + id + ' should be in CSS file.'
			);
		});

		test.done();
	},

	template: function(test) {
		var css = grunt.file.read('test/tmp/template/icons.css');

		// There should be comment from custom template
		test.ok(
			find(css, 'Custom template'),
			'Comment from custom template.'
		);

		test.done();
	},

	html_template: function(test) {
		var demo = grunt.file.read('test/tmp/html_template/icons.html');

		// There should be comment from custom template
		test.ok(
			find(demo, 'Custom template'),
			'Comment from custom template.'
		);

		test.done();
	},

	relative_path: function(test) {
		var css = grunt.file.read('test/tmp/relative_path/icons.css');

		// CSS links to font files are correct
		'woff,ttf,eot'.split(',').forEach(function(type) {
			test.ok(
				find(css, 'url("../iamrelative/icons.' + type),
				'File path ' + type + ' should be in CSS file.'
			);
		});

		test.done();
	},

	sass: function(test) {
		test.ok(fs.existsSync('test/tmp/sass/_icons.sass'), 'SASS file with underscore created.');
		test.ok(!fs.existsSync('test/tmp/sass/icons.sass'), 'SASS file without underscore not created.');
		test.ok(!fs.existsSync('test/tmp/sass/icons.css'), 'CSS file not created.');

		var svgs = grunt.file.expand('test/src/**.*');
		var sass = grunt.file.read('test/tmp/sass/_icons.sass');

		// There should be comment from custom template
		var m = sass.match(/\/\* *(.*?) *\*\//g);
		test.ok(!m, 'No regular CSS comments.');

		// There should be comment from custom template
		m = sass.match(/^\/\//gm);
		test.equal(m && m.length, 2, 'Single line comments.');

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
		test.equal(m && m.length, 2, 'Single line comments.');

		// Every SVG file should have two corresponding entries in CSS file
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg');
			test.ok(
				find(less, '.icon-' + id + '() {\n\t&:before'),
				'LESS Mixin ' + id + ' should be in CSS file.'
			);
		});

		test.done();
	},

	stylus_bem: function(test) {
		test.ok(fs.existsSync('test/tmp/stylus_bem/icons.styl'), 'Stylus file created.');
		test.ok(!fs.existsSync('test/tmp/stylus_bem/icons.css'), 'CSS file not created.');

		var styl = grunt.file.read('test/tmp/stylus_bem/icons.styl');

		// There should be comment from custom template
		var m = styl.match(/\/\* *(.*?) *\*\//g);
		test.ok(!m, 'No regular CSS comments.');

		// There should be comment from custom template
		m = styl.match(/^\/\//gm);
		test.equal(m && m.length, 2, 'Single line comments.');

		var stylus = require('stylus');
		var s = stylus(styl);

		s.render(function(err, css) {
			if (err) {
				console.log('Stylus compile error:');
				console.log(err);
			}
			test.ok(!err, 'Stylus file compiled.');
			test.done();
		});
	},

	stylus_bootstrap: function(test) {
		test.ok(fs.existsSync('test/tmp/stylus_bootstrap/icons.styl'), 'Stylus file created.');
		test.ok(!fs.existsSync('test/tmp/stylus_bootstrap/icons.css'), 'CSS file not created.');

		var styl = grunt.file.read('test/tmp/stylus_bootstrap/icons.styl');

		var stylus = require('stylus');
		var s = stylus(styl);

		s.render(function(err, css) {
			if (err) {
				console.log('Stylus compile error:');
				console.log(err);
			}
			test.ok(!err, 'Stylus file compiled.');
			test.done();
		});
	},

	spaces: function(test) {
		var css = grunt.file.read('test/tmp/spaces/icons.css');

		test.ok(
			find(css, '.icon_ma-il-ru:before'),
			'Spaces in class name should be replaced by hyphens.'
		);

		test.done();
	},

	disable_demo: function(test) {
		test.ok(fs.existsSync('test/tmp/disable_demo/icons.css'), 'CSS file created.');
		test.ok(!fs.existsSync('test/tmp/disable_demo/icons.html'), 'HTML file not created.');

		test.done();
	},

	non_css_demo: function(test) {
		test.ok(!fs.existsSync('test/tmp/non_css_demo/icons.css'), 'CSS file not created.');
		test.ok(fs.existsSync('test/tmp/non_css_demo/icons.html'), 'HTML file created.');

		var html = grunt.file.read('test/tmp/non_css_demo/icons.html');

		test.ok(
			find(html, '@font-face {'),
			'Font-face declaration exists in HTML.'
		);

		test.ok(
			find(html, '.icon {'),
			'Base icon exists in HTML.'
		);

		test.ok(
			!find(html, 'url("../iamrelative/icons-'),
			'Relative paths should not be in HTML.'
		);

		test.ok(
			!find(html, '&:before'),
			'LESS mixins should not be in HTML.'
		);

		// Every SVG file should have corresponding entry in <style> block
		var svgs = grunt.file.expand('test/src/**.*');
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg');
			test.ok(
				find(html, '.icon_' + id + ':before'),
				'Icon ' + id + ' CSS should be in HTML file.'
			);
		});

		test.done();
	},

	parent_source: function(test) {
		var svgs = grunt.file.expand('test/src/**.*');
		var css = grunt.file.read('test/tmp/parent_source/icons.css');

		// Every SVG file should have corresponding entry in CSS file
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg');
			test.ok(
				find(css, '.icon_' + id + ':before'),
				'Icon ' + id + ' should be in CSS file.'
			);
		});

		test.done();
	},

	ligatures: function(test) {
		var svgs = grunt.file.expand('test/src/**.*');
		var css = grunt.file.read('test/tmp/ligatures/icons.css');

		// Every SVG file should have corresponding entry in CSS file
		svgs.forEach(function(file) {
			var name = path.basename(file, '.svg');
			test.ok(
				find(css, 'content:"'+name+'";'),
				'Icon ' + name + ' should be in CSS file.'
			);
		});

		test.done();
	},

	duplicate_names: function(test) {
		var svgs = grunt.file.expand('test/src_duplicate_names/**/*.svg');
		var css = grunt.file.read('test/tmp/duplicate_names/icons.css');

		// Every SVG file should have corresponding entry in CSS file
		svgs.forEach(function(file) {
			var id = [path.basename(path.dirname(file)), path.basename(file, '.svg')].join('-');
			test.ok(
				find(css, '.icon_' + id + ':before'),
				'Icon ' + id + ' should be in CSS file.'
			);
		});

		test.done();
	},

	order: function(test) {
		var svgs = grunt.file.expand('test/src/**.*');
		var css = grunt.file.read('test/tmp/order/icons.css');

		// Font-face src rules should be in right order
		test.ok(
			find(css, 'src:url("icons.svg?#icons") format("svg"),\n\t\turl("icons.woff") format("woff");'),
			'Font-face src rules should be in right order.'
		);

		test.done();
	},

	template_options: function(test) {
		var svgs = grunt.file.expand('test/src/**.*');
		var less = grunt.file.read('test/tmp/template_options/icons.less');
		var html = grunt.file.read('test/tmp/template_options/icons.html');

		test.ok(
				find(less, '.glyph-icon {'),
				'Class .glyph-icon should be in LESS file.'
		);


		// Every SVG file should have corresponding entry in LESS and HTML files
		svgs.forEach(function(file) {
			var id = path.basename(file, '.svg');
			test.ok(
					find(less, '.make-icon-' + id + '() {'),
					'Mixin .make-icon-' + id + ' should be in LESS file.'
			);
			test.ok(
					find(less, '.glyph_' + id + '{'),
					'Icon .glyph_' + id + ' should be in LESS file.'
			);
			test.ok(
					find(html, '<div class="icons__item" data-name="' + id + '"><i class="glyph-icon glyph_' + id + '"></i> glyph_' + id + '</div>'),
					'Icon .glyph_' + id + ' should be in HTML file.'
			);
		});

		test.done();
	}
};
