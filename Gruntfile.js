/*jshint node:true*/
module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		webfont: {
			test1: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/test1',
				options: {
					hashes: false
				}
			},
			test2: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/test2/fonts',
				destCss: 'test/tmp/test2',
				options: {
					font: 'myfont',
					types: 'woff,svg',
					syntax: 'bootstrap'
				}
			},
			embed: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/embed',
				options: {
					hashes: false,
					embed: true
				}
			},
			embed_woff: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/embed_woff',
				options: {
					types: 'woff',
					hashes: false,
					embed: true
				}
			},
			embed_ttf: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/embed_ttf',
				options: {
					types: 'ttf',
					hashes: false,
					embed: 'ttf'
				}
			},
			embed_ttf_woff: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/embed_ttf_woff',
				options: {
					types: 'ttf,woff',
					hashes: false,
					embed: 'ttf,woff'
				}
			},
			one: {
				src: 'test/src_one/*.svg',
				dest: 'test/tmp/one',
				options: {
					hashes: false
				}
			},
			template: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/template',
				options: {
					template: 'test/templates/template.css'
				}
			},
			html_template: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/html_template',
				options: {
					htmlDemoTemplate: 'test/templates/template.html'
				}
			},
			relative_path: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/relative_path',
				options: {
					relativeFontPath: '../iamrelative',
					hashes: false
				}
			},
			sass: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/sass',
				options: {
					stylesheet: 'sass'
				}
			},
			less: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/less',
				options: {
					stylesheet: 'less'
				}
			},
			stylus_bem: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/stylus_bem',
				options: {
					stylesheet: 'styl'
				}
			},
			stylus_bootstrap: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/stylus_bootstrap',
				options: {
					stylesheet: 'styl',
					syntax: 'bootstrap'
				}
			},
			spaces: {
				src: 'test/src_space/*.svg',
				dest: 'test/tmp/spaces'
			},
			disable_demo: {
				src: 'test/src_one/*.svg',
				dest: 'test/tmp/disable_demo',
				options: {
					htmlDemo: false
				}
			},
			non_css_demo: {
				src: 'test/src/*.svg',
				dest: 'test/tmp/non_css_demo',
				options: {
					stylesheet: 'styl',
					relativeFontPath: '../iamrelative',
					htmlDemo: true
				}
			},
			parent_source: {
				src: '../grunt-webfont/test/src/*.svg',
				dest: 'test/tmp/parent_source',
				options: {
					hashes: false
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

	grunt.registerTask('default', ['clean', 'webfont', 'nodeunit', 'jshint', 'clean']);
	grunt.registerTask('build', ['default']);

};
