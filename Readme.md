# SVG to webfont converter for Grunt

[![Build Status](https://travis-ci.org/sapegin/grunt-webfont.svg)](https://travis-ci.org/sapegin/grunt-webfont)
[![Downloads on npm](http://img.shields.io/npm/dm/grunt-webfont.svg?style=flat)](https://www.npmjs.com/package/grunt-webfont)

Generate custom icon webfonts from SVG files via Grunt. Based on [Font Custom](http://fontcustom.com/).

This task will make all you need to use font-face icon on your website: font in all needed formats, CSS/Sass/LESS/Stylus and HTML demo page.

## Features

* Works on Mac, Windows and Linux.
* Very flexible.
* Supports all web font formats: WOFF, [WOFF2](https://github.com/sapegin/grunt-webfont/wiki/WOFF2-support), EOT, TTF and SVG.
* Semantic: uses [Unicode private use area](http://bit.ly/ZnkwaT).
* [Cross-browser](http://www.fontspring.com/blog/further-hardening-of-the-bulletproof-syntax/): IE8+.
* BEM or Bootstrap output CSS style.
* CSS preprocessors support.
* Data:uri embedding.
* Ligatures.
* HTML preview.
* Custom templates.


## Installation

This plugin requires Grunt 0.4. Note that `ttfautohint` is optional, but your generated font will not be properly hinted if it’s not installed. And make sure you don’t use `ttfautohint` 0.97 because that version won’t work.

### OS X

```
brew install ttfautohint fontforge --with-python
npm install grunt-webfont --save-dev
```

*You may need to use `sudo` for `brew`, depending on your setup.*

*`fontforge` isn’t required for `node` engine (see below).*

:skull: [Notes on experimental WOFF2 support](https://github.com/sapegin/grunt-webfont/wiki/WOFF2-support).

### Linux

```
sudo apt-get install fontforge ttfautohint
npm install grunt-webfont --save-dev
```

*`fontforge` isn’t required for `node` engine (see below).*

:skull: [Notes on experimental WOFF2 support](https://github.com/sapegin/grunt-webfont/wiki/WOFF2-support).

### Windows

```
npm install grunt-webfont --save-dev
```

Then [install `ttfautohint`](http://www.freetype.org/ttfautohint/#download) (optional).

*Only `node` engine available (see below).*


## Available Engines

There are two font rendering engines available. See also `engine` option below.

### fontforge

#### Pros

* All features supported.
* The best results.

#### Cons

* Doesn’t work on Windows.
* You have to install `fontforge`.
* Really weird bugs sometimes.

### node

#### Pros

* No external dependencies (except optional `ttfautohint`).
* Works on all platforms.

#### Cons

* Doesn’t work with some SVG files.
* Ligatures aren’t supported.


## Configuration

Add somewhere in your `Gruntfile.js`:

```javascript
grunt.loadNpmTasks('grunt-webfont');
```

Inside your `Gruntfile.js` file add a section named `webfont`. See Parameters section below for details.


### Parameters

#### src

Type: `string|array`

Glyphs list: SVG. String or array. Wildcards are supported.

#### dest

Type: `string`

Directory for resulting files.

#### destCss

Type: `string` Default: _`dest` value_

Directory for resulting CSS files (if different than font directory).

#### Options

All options should be inside `options` object:

``` javascript
webfont: {
	icons: {
		src: 'icons/*.svg',
		dest: 'build/fonts',
		options: {
			...
		}
	}
}
```

#### font

Type: `string` Default: `icons`

Name of font and base name of font files.

#### fontFilename

Type: `string` Default: Same as `font` option

Filename for generated font files, you can add placeholders for the same data that gets passed to the [template](#template).

For example, to get the hash to be part of the filenames:

```js
options: {
	fontFilename: 'icons-{hash}'
}
```

#### hashes

Type: `boolean` Default: `true`

Append font file names with unique string to flush browser cache when you update your icons.

#### styles

Type: `string|array` Default: `'font,icon'`

List of styles to be added to CSS files: `font` (`font-face` declaration), `icon` (base `.icon` class), `extra` (extra stuff for Bootstrap (only for `syntax` = `'bootstrap'`).

#### types

Type: `string|array` Default: `'eot,woff,ttf'`, available: `'eot,woff2,woff,ttf,svg'`

Font files types to generate.

:skull: [Notes on experimental WOFF2 support](https://github.com/sapegin/grunt-webfont/wiki/WOFF2-support).

#### order

Type: `string|array` Default: `'eot,woff,ttf,svg'`

Order of `@font-face`’s `src` values in CSS file. (Only file types defined in `types` option will be generated.)

#### syntax

Type: `string` Default: `bem`

Icon classes syntax. `bem` for double class names: `icon icon_awesome` or `bootstrap` for single class names: `icon-awesome`.

#### template

Type: `string` Default: `null`

Custom CSS template path (see `tasks/templates` for some examples). Should be used instead of `syntax`. (You probably need to define `htmlDemoTemplate` option too.)

Template is a pair of CSS and JSON (optional) files with the same name.

For example, your Gruntfile:

```js
options: {
	template: 'my_templates/tmpl.css'
}
```

`my_templates/tmpl.css`:

```css
@font-face {
	font-family:"<%= fontBaseName %>";
	...
}
...
```

`my_templates/tmpl.json`:

```json
{
	"baseClass": "icon",
	"classPrefix": "icon_"
}
```

Some extra data is available for you in templates:

* `hash`: a unique string to flush browser cache. Available even if `hashes` option is `false`.

* `fontRawSrcs`: array of font-face’s src values not merged to a single line:

```
[
	[
		'url("icons.eot")'
	],
	[
		'url("icons.eot?#iefix") format("embedded-opentype")',
		'url("icons.woff") format("woff")',
		'url("icons.ttf") format("truetype")'
	]
]
```


#### templateOptions

Type: `object` Default: `{}`

Extends/overrides CSS template or syntax’s JSON file. Allows custom class names in default css templates.

``` javascript
options: {
	templateOptions: {
		baseClass: 'glyph-icon',
		classPrefix: 'glyph_',
		mixinPrefix: 'glyph-'
	}
}
```

#### stylesheet

Type: `string` Default: `'css'` or extension of `template`

Stylesheet type. Can be css, sass, scss, less... If `sass` or `scss` is used, `_` will prefix the file (so it can be a used as a partial).

#### relativeFontPath

Type: `string` Default: `null`

Custom font path. Will be used instead of `destCss` *in* CSS file. Useful with CSS preprocessors.

#### htmlDemo

Type: `boolean` Default: `true`

If `true`, an HTML file will be available (by default, in `destCSS` folder) to test the render.

#### htmlDemoTemplate

Type: `string` Default: `null`

Custom demo HTML template path (see `tasks/templates/demo.html` for an example) (requires `htmlDemo` option to be true).

#### destHtml

Type: `string` Default: _`destCss` value_

Custom demo HTML demo path (requires `htmlDemo` option to be true).

#### embed

Type: `string|array` Default: `false`

If `true` embeds WOFF (*only WOFF*) file as data:uri.

IF `ttf` or `woff` or `ttf,woff` embeds TTF or/and WOFF file.

If there are more file types in `types` option they will be included as usual `url(font.type)` CSS links.

#### ligatures

Type: `boolean` Default: `false`

If `true` the generated font files and stylesheets will be generated with opentype ligature features. The character sequences to be replaced by the ligatures are determined by the file name (without extension) of the original SVG.

For example, you have a heart icon in `love.svg` file. The HTML `<h1>I <span class="ligature-icons">love</span> you!</h1>` will be rendered as `I ♥ you!`.

#### rename

Type: `function` Default: `path.basename`

You can use this function to change how file names translates to class names (the part after `icon_` or `icon-`). By default it’s a name of a file.

For example you can group your icons into several folders and add folder name to class name:

```js
options: {
	rename: function(name) {
		// .icon_entypo-add, .icon_fontawesome-add, etc.
		return [path.basename(path.dirname(name)), path.basename(name)].join('-');
	}
}
```

#### skip

Type: `boolean` Default: `false`

If `true` task will not be ran. In example, you can skip task on Windows (becase of difficult installation):

```javascript
options: {
	skip: require('os').platform() === 'win32'
}
```

#### engine

Type: `string` Default: `fontforge`

Font rendering engine: `fontforge` or `node`. See comparison in [Available Engines](#available-engines) section above.

#### ie7

Type: `boolean` Default: `false`

Adds IE7 support using a `*zoom: expression()` hack.

#### startCodepoint

Type: `integer` Default: `0xF101`

Starting codepoint used for the generated glyphs. Defaults to the start of the Unicode private use area.

#### codepoints

Type: `object` Default: `null`

Specific codepoints to use for certain glyphs. Any glyphs not specified in the codepoints block will be given incremented as usual from the `startCodepoint`, skipping duplicates.

```javascript
options: {
	codepoints: {
		single: 0xE001
	}
}
```

#### codepointsFile
Type: `string` Default: `null`

Uses and Saves the codepoint mapping by name to this file.

NOTE: will overwrite the set codepoints option.

#### autoHint

Type: `boolean` Default: `true`

Enables font auto hinting using `ttfautohint`.

#### round

Type: `number` Default: `10e12`

Setup SVG path rounding.

#### fontHeight

Type: `number` Default: `512`

The output font height.

#### descent

Type: `number` Default: `64`

The font descent. The descent should be a positive value. The ascent formula is: `ascent = fontHeight - descent`.

#### callback

Type: `function` Default: `null`

Allows for a callback to be called when the task has completed and passes in the filename of the generated font, an array of the various font types created, an array of all the glyphs created and the hash used to flush browser cache.

```javascript
options: {
	callback: function(filename, types, glyphs, hash) {
		// ...
	}
}
````

### Config Examples

#### Simple font generation

```javascript
webfont: {
	icons: {
		src: 'icons/*.svg',
		dest: 'build/fonts'
	}
}
```

#### Custom font name, fonts and CSS in different folders

```javascript
webfont: {
	icons: {
		src: 'icons/*.svg',
		dest: 'build/fonts',
		destCss: 'build/fonts/css',
		options: {
			font: 'ponies'
		}
	}
}
```

#### Custom CSS classes

```js
webfont: {
	icons: {
		src: 'icons/*.svg',
		dest: 'build/fonts',
		options: {
			syntax: 'bem',
			templateOptions: {
				baseClass: 'glyph-icon',
				classPrefix: 'glyph_',
				mixinPrefix: 'glyph-'
			}
		}
	}
}
```

#### To use with CSS preprocessor

```javascript
webfont: {
	icons: {
		src: 'icons/*.svg',
		dest: 'build/fonts',
		destCss: 'build/styles',
		options: {
			stylesheet: 'styl',
			relativeFontPath: '/build/fonts'
		}
	}
}
```

#### Embedded font file

```javascript
webfont: {
	icons: {
		src: 'icons/*.svg',
		dest: 'build/fonts',
		options: {
			types: 'woff',
			embed: true
		}
	}
}
```

## CSS Preprocessors Caveats

You can change CSS file syntax using `stylesheet` option (see above). It change file extension (so you can specify any) with some tweaks. Replace all comments with single line comments (which will be removed after compilation).

### SASS

If `stylesheet` option is `sass` or `scss`, `_` will prefix the file (so it can be a used as a partial).

### LESS

If `stylesheet` option is `less`, regular CSS icon classes will be expanded with corresponding LESS mixins.

The LESS mixins then may be used like so:

```css
.profile-button {
	.icon-profile;
}
```

## Changelog

The changelog can be found in the [Changelog.md](Changelog.md) file.

## Troubleshooting

### I have problems displaying the font in Firefox

Firefox doesn’t allow cross-domain fonts: [Specifications](http://www.w3.org/TR/css3-fonts/#font-fetching-requirements), [Bugzilla Ticket](https://bugzilla.mozilla.org/show_bug.cgi?id=604421), [How to fix it](https://coderwall.com/p/v4uwyq).

## License

The MIT License, see the included [License.md](License.md) file.
