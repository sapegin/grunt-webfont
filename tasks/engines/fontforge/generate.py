# Based on https://github.com/FontCustom/fontcustom/blob/master/lib/fontcustom/scripts/generate.py

import fontforge
import os
import sys
import hashlib
import json
from subprocess import call
from distutils.spawn import find_executable

# TODO: codepoints option

args = json.load(sys.stdin)

f = fontforge.font()
f.encoding = 'UnicodeFull'
f.design_size = 16
f.em = 512
f.ascent = 448
f.descent = 64

m = hashlib.md5()
cp = args['startCodepoint']

KERNING = 15


def empty_char(f, c):
	pen = f.createChar(ord(c), c).glyphPen()
	pen.moveTo((0, 0))
	pen = None


if args['addLigatures']:
	f.addLookup('liga', 'gsub_ligature', (), (('liga', (('latn', ('dflt')), )), ))
	f.addLookupSubtable('liga', 'liga')

for dirname, dirnames, filenames in os.walk(args['inputDir']):
	for filename in sorted(filenames):
		name, ext = os.path.splitext(filename)
		filePath = os.path.join(dirname, filename)
		size = os.path.getsize(filePath)

		if ext in ['.svg', '.eps']:
			if ext in ['.svg']:
				# HACK: Remove <switch> </switch> tags
				svgfile = open(filePath, 'r+')
				svgtext = svgfile.read()
				svgfile.seek(0)

				# Replace the <switch> </switch> tags with nothing
				svgtext = svgtext.replace('<switch>', '')
				svgtext = svgtext.replace('</switch>', '')

				# Remove all contents of file so that we can write out the new contents
				svgfile.truncate()
				svgfile.write(svgtext)
				svgfile.close()

			m.update(filename + str(size) + ';')
			if args['addLigatures']:
				[empty_char(f, c) for c in name]
				glyph = f.createChar(cp, name)
				glyph.addPosSub('liga', tuple(name))
			else:
				glyph = f.createChar(cp)
			glyph.importOutlines(filePath)

			glyph.left_side_bearing = glyph.right_side_bearing = 0
			glyph.round()

			cp += 1

		f.autoWidth(0, 0, 512)

fontfile = args['dest'] + os.path.sep + args['fontBaseName']
if args['addHashes']:
	fontfile += '-' + m.hexdigest()

f.fontname = args['fontBaseName']
f.familyname = args['fontBaseName']
f.fullname = args['fontBaseName']

if args['addLigatures']:
	def generate(filename):
		f.generate(filename, flags=('opentype'))
else:
	def generate(filename):
		f.generate(filename)


# TTF
generate(fontfile + '.ttf')

# Hint the TTF file
# ttfautohint is optional
if find_executable('ttfautohint'):
	call("ttfautohint --symbol --fallback-script=latn --windows-compatibility --no-info '" + fontfile + ".ttf' '" + fontfile + "-hinted.ttf' && mv '" + fontfile + "-hinted.ttf' '" + fontfile + ".ttf'", shell=True)
	f = fontforge.open(fontfile + '.ttf')

# SVG
if 'svg' in args['types']:
	generate(fontfile + '.svg')

	# Fix SVG header for webkit (from: https://github.com/fontello/font-builder/blob/master/bin/fontconvert.py)
	svgfile = open(fontfile + '.svg', 'r+')
	svgtext = svgfile.read()
	svgfile.seek(0)
	svgfile.write(svgtext.replace('<svg>', '<svg xmlns="http://www.w3.org/2000/svg">'))
	svgfile.close()

scriptPath = os.path.dirname(os.path.realpath(__file__))

# WOFF
if 'woff' in args['types']:
	generate(fontfile + '.woff')

# EOT
if 'eot' in args['types']:
	# eotlitetool.py script to generate IE7-compatible .eot fonts
	call("python '" + scriptPath + "/../../bin/eotlitetool.py' '" + fontfile + ".ttf' --output '" + fontfile + ".eot'", shell=True)

# Delete TTF if not needed
if not 'ttf' in args['types']:
	os.remove(fontfile + '.ttf')

print(json.dumps({'file': fontfile}))
