/**
 * grunt-webfont: common stuff
 *
 * @author Artem Sapegin (http://sapegin.me)
 */

var exports = {};

/**
 * Unicode Private Use Area start.
 * http://en.wikipedia.org/wiki/Private_Use_(Unicode)
 * @type {Number}
 */
exports.UNICODE_PUA_START = 0xF101;

/**
 * @font-face’s src values generation rules.
 * @type {Object}
 */
exports.fontsSrcsMap = {
	eot: [
		{
			ext: '.eot'
		},
		{
			ext: '.eot?#iefix',
			format: 'embedded-opentype'
		}
	],
	woff: [
		false,
		{
			ext: '.woff',
			format: 'woff',
			embeddable: true
		},
	],
	ttf: [
		false,
		{
			ext: '.ttf',
			format: 'truetype',
			embeddable: true
		},
	],
	svg: [
		false,
		{
			ext: '.svg?#{fontBaseName}',
			format: 'svg'
		},
	]
};

/**
 * CSS fileaname prefixes: _icons.scss.
 * @type {Object}
 */
exports.cssFilePrefixes = {
	_default: '',
	sass: '_',
	scss: '_'
};

/**
 * @font-face’s src parts seperators.
 * @type {Object}
 */
exports.fontSrcSeparators = {
	_default: ',\n\t\t',
	styl: ', '
};

/**
 * List of available font formats.
 * @type {String}
 */
exports.fontFormats = 'eot,woff,ttf,svg';

/**
 * Glob mask for all available font formats.
 * @type {String}
 */
exports.fontFileMask = '*.{' + exports.fontFormats + '}';


// Expose
module.exports = exports;
