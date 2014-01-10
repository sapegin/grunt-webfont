### 2013-12-13 v0.2.2

* You can use templates with any extension: `.sass` for example (by [@borodean](https://github.com/borodean)).
* SVG fonts disabled by default.

### 2013-11-17 v0.2.1

* `templateOptions` option and templates refactoring (by [@tylerbeck](https://github.com/tylerbeck)).
* Improve fontforge result parsing (by [@jantimon](https://github.com/jantimon)).
* Tweak HTML demo page look & feel.
* Tweak `ttfautohint` call.

### 2013-10-29 v0.2.0

* Huge code refactoring.
* Templates refactoring (see readme and #55).
* Scripts now really works in Python 3 (#50).
* Smarter warnings handling (#38).
* `order` option.

### 2013-10-28 v0.1.12

* Scripts should work on Python 3 now.
* Custom HTML demo template receives CSS options (by [@andreu86](https://github.com/andreu86)).
* Readme improvements (by [@mrzmyr](https://github.com/mrzmyr)).

### 2013-10-23 v0.1.11

* Autohint for all formats (by [@borodean](https://github.com/borodean)).

### 2013-10-16 v0.1.10

* `rename` option.
* Quote Base64 strings to prevent errors in Stylus.

### 2013-09-22 v0.1.9

* Fix handling pathes with spaces.
* Font smoothing for Firefox on OS X (by [@MoOx](https://github.com/MoOx)).
* Deprecated `md5` Pyhton module replaced with `hashlib` (by [@Nyalab](https://github.com/Nyalab)).

### 2013-08-21 v0.1.8

* Set glyphs width automatically.

### 2013-08-21 v0.1.7

* Ligatures (by [@prehnRA](https://github.com/prehnRA)).

### 2013-08-20 v0.1.6

* Bug fixes.

### 2013-06-30 v0.1.5

* `destHtml` option (by [@timhettler](https://github.com/timhettler)).
* Improved kerning (by [@frekw](https://github.com/frekw)).

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
