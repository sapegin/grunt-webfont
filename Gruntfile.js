/*jshint node:true*/
module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		webfont: {
			test1: {
				src: 'test/src/*.svg',
				dest: 'test/tmp',
				options: {
					hashes: false
				}
			},
			test2: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/fonts',
				destCss: 'test/tmp',
				options: {
					font: 'myfont',
					types: 'woff,svg',
					stylesheet: 'bootstrap'
				}
			}
		},
		nodeunit: {
			all: ['test/webfont_test.js']
		},
		jshint: {
			all: ['Gruntfile.js', 'tasks/*.js', 'test/*.js'],
			options: {
				node: true,
				white: false,
				smarttabs: true,
				eqeqeq: true,
				immed: true,
				latedef: false,
				newcap: true,
				undef: true
			}
		}
	});

	grunt.loadTasks('tasks');

	var fs = require('fs');

	grunt.registerTask('clean', 'Copy files to test.', function() {
		if (grunt.file.isDir('test/tmp')) {
			grunt.file.expand('test/tmp/**/*.*').forEach(function(file) {
				fs.unlinkSync(file);
			});

			grunt.file.expand('test/tmp/**/*').forEach(function(file) {
				fs.rmdirSync(file);
			});
			fs.rmdirSync('test/tmp');
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');

	grunt.registerTask('default', ['clean', 'webfont', 'nodeunit', 'jshint']);

};
