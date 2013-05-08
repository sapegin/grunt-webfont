# SVG to webfont converter for Grunt [![Build Status](https://travis-ci.org/sapegin/grunt-webfont.png)](https://travis-ci.org/sapegin/grunt-webfont)

Generate custom icon webfonts from SVG/EPS files via Grunt. Based on [Font Custom](http://endtwist.github.com/fontcustom/).

This task will make all you need to use font-face icon on your website: font in all needed formats, CSS/SASS/LESS/Stylus and HTML demo page.

## Features

* Very flexible.
* Semantic: uses [Unicode private use area](http://bit.ly/ZnkwaT).
* [Cross-browser](http://www.fontspring.com/blog/further-hardening-of-the-bulletproof-syntax/): IE8+.
* BEM or Bootstrap output CSS style.
* CSS preprocessors support.
* Data:uri embedding.
* HTML preview.


## Installation

This plugin requires Grunt 0.4.

### OS X

```
brew install fontforge ttfautohint
brew install https://raw.github.com/sapegin/grunt-webfont/master/Formula/sfnt2woff.rb
npm install grunt-webfont --save-dev
```

You may need to use `sudo` for `brew`, depending on your setup.

### Linux

```
sudo apt-get install fontforge eot-utils ttfautohint
wget http://people.mozilla.com/~jkew/woff/woff-code-latest.zip
unzip woff-code-latest.zip -d sfnt2woff && cd sfnt2woff && make && sudo mv sfnt2woff /usr/local/bin/
npm install grunt-webfont --save-dev
```

*Note that if `ttfautohint` is not available in your distribution, your generated font will not be properly hinted.*


## Configuration

Add somewhere in your `Gruntfile.js`:

```javascript
grunt.loadNpmTasks('grunt-webfont');
```

Inside your `Gruntfile.js` file add a section named `webfont`. See Parameters section below for details.


### Parameters

#### src `string|array`

Glyphs list: SVG or EPS. String or array. Wildcards are supported.

#### dest `string`

Directory for resulting files.

#### [destCss] `string` (default: `dest` value)

Directory for resulting CSS files (if different than font directory).

#### Options

#### [font] `string` (default: `'icons'`)

Name of font and base name of font files.

#### [hashes] `boolean` (default: `true`)

Append font file names with unique string to flush browser cache when you update your icons.

#### [styles] `string|array` (default: `'font,icon'`)

List of styles to be added to CSS files: `font` (`font-face` declaration), `icon` (base `.icon` class), `extra` (extra stuff for Bootstrap (only for `syntax` = `'bootstrap'`).

#### [types] `string|array` (default: `'woff,ttf,eot,svg'`)

Font files types to generate.

#### [syntax] `string` (default: `'bem'`)

Icon classes syntax. `bem` for double class names: `icon icon_awesome` or `bootstrap` for single class names: `icon-awesome`.

#### [template] `string` (default: null)

Custom CSS template path (see `tasks/templates` for some examples). Should be used instead of `syntax`. (You probably need to define `htmlDemoTemplate` option too.)

#### [stylesheet] `string` (default: `'css'`)

Stylesheet type. Can be css, sass, scss, less... If `sass` or `scss` is used, `_` will prefix the file (so it can be a used as a partial).

#### [relativeFontPath] `string` (default: null)

Custom font path. Will be used instead of `destCss` *in* CSS file. Useful with CSS preprocessors.

#### [htmlDemo] `boolean` (default: `true`)

If `true`, an HTML file will be available in `destCSS` folder to test the render.

#### [htmlDemoTemplate] `string` (default: null)

Custom demo HTML template path (see `tasks/templates/demo.html` for an example) (requires `htmlDemo` option to be true).

#### [embed] `string|array` (default: false)

If `true` embeds WOFF (*only WOFF*) file as data:uri.

IF `ttf` or `woff` or `ttf,woff` embeds TTF or/and WOFF file.

If there’re more file types in `types` option they will be included as usual `url(font.type)` CSS links.

#### [skip] `boolean` (default: `false`)

If `true` task will not be ran. In example, you can skip task on Windows (becase of difficult installation):

``` javascript
skip: require('os').platform() === 'win32'
```


### Config Examples

#### Simple font generation

``` javascript
webfont: {
  icons: {
    src: 'icons/*.svg',
    dest: 'build/fonts'
  }
}
```

#### Custom font name, fonts and CSS in different folders

``` javascript
webfont: {
  icons: {
    src: 'icons/*.svg',
    dest: 'build/fonts',
    destCss: 'build/fonts/css'
    options: {
    	font: 'ponies'
    }
  }
}
```

#### To use with CSS preprocessor

``` javascript
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

``` javascript
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


## Release History

### 2013-05-08 v0.1.4

* `htmlDemoTemplate` option (by [@andreu86](https://github.com/andreu86)).
* Various bug fixes and tweaks (thanks [@MoOx](https://github.com/MoOx), [@iham](https://github.com/iham), [@timhettler](https://github.com/timhettler)).

### 2013-04-30 v0.1.3

* HTML demo works with CSS preprocessors stylesheets.
* TTF files embedding (by [@katzlbt](https://github.com/katzlbt) and me).
* Don not stop Grunt when font contains no glyphs (by [@iham](https://github.com/iham)).
* Better fontforge stdout handling (by [@MoOx](https://github.com/MoOx)).

### 2013-04-13 v0.1.2

* `relativeFontPath` option (by [@gregvanbrug](https://github.com/gregvanbrug)).
* `template` option.
* Better LESS support (by [@gregvanbrug](https://github.com/gregvanbrug)).
* Better Stylus support.
* Bug fixes.

### 2013-03-17 v0.1.1

* Fix error when generating font with one glyph.

### 2013-02-18 v0.1.0

* Grunt 0.4 support.
* Separate CSS/font destinations (by [@scanieso](https://github.com/scanieso)).
* Minimal CSS preprocessors support (by [@MoOx](https://github.com/MoOx)).
* Updated generator script (by [@MoOx](https://github.com/MoOx) and me).
* Generated CSS not include broken links to font files.
* Data:uri WOFF files embedding.


---

## License

The MIT License, see the included `License.md` file.
