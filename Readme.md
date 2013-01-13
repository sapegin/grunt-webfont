# SVG to webfont converter for Grunt

Generate custom icon webfonts from SVG/EPS files via Grunt. Based on [Font Custom](http://endtwist.github.com/fontcustom/).

This task will make all you need to use font-face icon on your website: font in all needed formats, CSS and HTML demo page.


## Installation

### OS X

```
brew install fontforge ttf2eot ttfautohint
brew install https://raw.github.com/sapegin/grunt-webfont/master/Formula/sfnt2woff.rb
npm install grunt-webfont
```

You may need to use `sudo` for `brew`, depending on your setup.


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

#### files `string|array`

Glyphs list: SVG or EPS. String or array. Wildcards are supported.

#### destDir `string`

Directory for resulting fonts and CSS files.

#### [font] `string` (default: `'icons'`)

Name of font and base name of font files.

#### [hashes] `boolean` (default: `true`)

Apend font file names with unique string to flush browser cache when you update your icons.

#### [styles] `string|array` (default: `'font,icon'`)

List of style to be added to CSS files: `font` (`font-face` declaration), `icon` (base `.icon` class), `extra` (extra stuff for Bootstrap (only for `stylesheet` = `'bootstrap'`).

#### [types] `string|array` (default: `'woff,ttf,eot,svg'`)

Font files types to generate.

#### [stylesheet] `string` (default: `'bem'`)

Icon classes syntax. `bem` for double class names: `icon icon_awesome` or `bootstrap` for single class names: `icon-awesome`.

#### [skip] `boolean` (default: `false`)

If `true` task will not be ran. In example, you can skip task on Windows (becase of difficult installation):

``` javascript
skip: require('os').platform() === 'win32'
```


### Config Example

``` javascript
webfont: {
  icons: {
    files: 'icons/*.svg',
    destDir: 'build/fonts'
  }
}
```


---

## License

The MIT License, see the included `License.md` file.
