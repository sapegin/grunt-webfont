/*jshint node:true*/
module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		lint: {
			files: [
				'tasks/webfont.js',
				'grunt.js'
			]
		},
		webfont: {
			test1: {
				files: 'test/src/*.svg',
				destDir: 'test/tmp',
				hashes: false
			},
			test2: {
				files: 'test/src/*.svg',
				destDir: 'test/tmp',
				font: 'myfont',
				types: 'woff,svg',
				stylesheet: 'bootstrap'
			}
		},
		test: {
			tasks: ['test/*_test.js']
		},
		jshint: {
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
		grunt.file.expand('test/tmp/**').forEach(function(file) {
			fs.unlinkSync(file);
		});
		fs.rmdirSync('test/tmp');
	});

	grunt.registerTask('default', 'lint clean webfont test clean');

};