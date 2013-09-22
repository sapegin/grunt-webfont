# Based on https://github.com/FontCustom/fontcustom/blob/master/lib/fontcustom/scripts/generate.py

import fontforge
import os
import argparse
import hashlib
import json
from subprocess import call
from distutils.spawn import find_executable


parser = argparse.ArgumentParser(description='Convert a directory of SVG and EPS files into a unified font file.')
parser.add_argument('input_dir', metavar='directory', type=unicode, help='directory of vector files')
parser.add_argument('output_dir', metavar='directory', type=unicode, help='output directory')
parser.add_argument('font', metavar='font', type=unicode, help='font name')
parser.add_argument('types', metavar='types', type=lambda s: s.split(','), help='output types')
parser.add_argument('--hashes', action='store_true', help='add hashes to file names')
parser.add_argument('--ligatures', action='store_true', help='add opentype ligatures to generated font files')
args = parser.parse_args()


f = fontforge.font()
f.encoding = 'UnicodeFull'
f.design_size = 16
f.em = 512
f.ascent = 448
f.descent = 64

m = hashlib.md5()
cp = 0xf100
files = []

KERNING = 15


def empty_char(f, c):
	pen = f.createChar(ord(c), c).glyphPen()
	pen.moveTo((0, 0))
	pen = None


if args.ligatures:
	f.addLookup('liga', 'gsub_ligature', (), (('liga', (('latn', ('dflt')), )), ))
	f.addLookupSubtable('liga', 'liga')

for dirname, dirnames, filenames in os.walk(args.input_dir):
	for filename in filenames:
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
			if args.ligatures:
				[empty_char(f, c) for c in name]
				glyph = f.createChar(cp, name)
				glyph.addPosSub('liga', tuple(name))
			else:
				glyph = f.createChar(cp)
			glyph.importOutlines(filePath)

			glyph.left_side_bearing = glyph.right_side_bearing = 0
			glyph.round()

			files.append(name)
			cp += 1

		f.autoWidth(0, 0, 512)

fontfile = args.output_dir + '/' + args.font
if args.hashes:
	fontfile += '-' + m.hexdigest()

f.fontname = args.font
f.familyname = args.font
f.fullname = args.font

if args.ligatures:
	def generate(filename):
		f.generate(filename, flags=('opentype'))
else:
	def generate(filename):
		f.generate(filename)


# TTF
generate(fontfile + '.ttf')

# SVG
if 'svg' in args.types:
	generate(fontfile + '.svg')

	# Fix SVG header for webkit (from: https://github.com/fontello/font-builder/blob/master/bin/fontconvert.py)
	svgfile = open(fontfile + '.svg', 'r+')
	svgtext = svgfile.read()
	svgfile.seek(0)
	svgfile.write(svgtext.replace('<svg>', '<svg xmlns="http://www.w3.org/2000/svg">'))
	svgfile.close()

scriptPath = os.path.dirname(os.path.realpath(__file__))

# WOFF
if 'woff' in args.types:
	generate(fontfile + '.woff')

# EOT
if 'eot' in args.types:
	# eotlitetool.py script to generate IE7-compatible .eot fonts
	call("python '" + scriptPath + "/eotlitetool.py' '" + fontfile + ".ttf' -o '" + fontfile + ".eot'", shell=True)
	call("mv '" + fontfile + ".eotlite' '" + fontfile + ".eot'", shell=True)

# Hint the TTF file or delete it if not needed
# ttfautohint is optional
if 'ttf' in args.types:
	if find_executable('ttfautohint'):
		call("ttfautohint -s -n '" + fontfile + ".ttf' '" + fontfile + "-hinted.ttf' && mv '" + fontfile + "-hinted.ttf' '" + fontfile + ".ttf'", shell=True)
else:
	os.remove(fontfile + '.ttf')

print json.dumps({'file': fontfile, 'names': files})
