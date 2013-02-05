# SVG to webfont converter for Grunt

Generate custom icon webfonts from SVG/EPS files via Grunt. Based on [Font Custom](http://endtwist.github.com/fontcustom/).

This task will make all you need to use font-face icon on your website: font in all needed formats, CSS and HTML demo page.


## Installation

### OS X

```
brew install fontforge ttfautohint sfnt2woff
npm install grunt-webfont
```

You may need to use `sudo` for `brew`, depending on your setup.

### Linux

```
sudo apt-get install fontforge eot-utils ttfautohint
wget http://people.mozilla.com/~jkew/woff/woff-code-latest.zip
unzip woff-code-latest.zip -d sfnt2woff && cd sfnt2woff && make && sudo mv sfnt2woff /usr/local/bin/
npm install grunt-webfont
```

*Note that if `ttfautohint` is not available in your distribution, Font Custom will still work but your generated font will not be properly hinted.*


## Configuration

For Grunt 0.3
`npm install grunt-webfont --save-dev`

For Grunt 0.4rc
`npm install git://github.com/sapegin/grunt-webfont.git --save-dev`

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

Apend font file names with unique string to flush browser cache when you update your icons.

#### [styles] `string|array` (default: `'font,icon'`)

List of style to be added to CSS files: `font` (`font-face` declaration), `icon` (base `.icon` class), `extra` (extra stuff for Bootstrap (only for `stylesheet` = `'bootstrap'`).

#### [types] `string|array` (default: `'woff,ttf,eot,svg'`)

Font files types to generate.

#### [syntax] `string` (default: `'bem'`)

Icon classes syntax. `bem` for double class names: `icon icon_awesome` or `bootstrap` for single class names: `icon-awesome`.

#### [stylesheet] `string` (default: `'css'`)

Stylesheet type. Can be css, sass, scss, less... If `sass` or `scss`is used, `_` will prefix the file (so it can be a used as a partial).

#### [htmlDemo] `boolean` (default: `true`)

If `true`, a .html will be available in `destCSS` to test the render.
If `stylesheet` is not `css`, will be set to false automatically.

#### [skip] `boolean` (default: `false`)

If `true` task will not be ran. In example, you can skip task on Windows (becase of difficult installation):

``` javascript
skip: require('os').platform() === 'win32'
```


### Config Example

``` javascript
webfont: {
  icons: {
    src: 'icons/*.svg',
    dest: 'build/fonts',
    destCss: 'build/fonts/css'
    options: {
    }
  }
}
```


---

## License

The MIT License, see the included `License.md` file.
