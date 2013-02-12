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
					syntax: 'bootstrap'
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
		},
		clean: ['test/tmp']
	});

	grunt.loadTasks('tasks');

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.registerTask('default', ['clean', 'webfont', 'nodeunit', 'jshint']);

};
