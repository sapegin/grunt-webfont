# Based on https://github.com/FontCustom/fontcustom/blob/master/lib/fontcustom/scripts/generate.py

import os
import json
import hashlib
import argparse
import fontforge
from subprocess import call
from distutils.spawn import find_executable

parser = argparse.ArgumentParser(description='Convert a directory of SVG and EPS files into a unified font file.')
parser.add_argument('input_dir', metavar='directory', type=str, help='directory of vector files')
parser.add_argument('output_dir', metavar='directory', type=str, help='output directory')

parser.add_argument('font', metavar='font', type=str, help='font name')
parser.add_argument('types', metavar='types', type=lambda s: s.split(','), help='output types')

parser.add_argument('--fontmap', metavar='fontmap', type=str, nargs='?', help='map filenames to unicode chars')

parser.add_argument('--hashes', action='store_true', help='add hashes to file names')
parser.add_argument('--ligatures', action='store_true', help='add opentype ligatures to generated font files')
args = parser.parse_args()


f = fontforge.font()
f.em = 512
f.ascent = 448
f.descent = 64
f.encoding = 'UnicodeFull'
f.design_size = 16

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

if args.fontmap:
	mapFile = open(args.fontmap, 'r')
	fontmap = json.load(mapFile)
	mapFile.close()

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

			char = cp
			if fontmap and name in fontmap:
				char = ord(fontmap[name])

			if args.ligatures:
				[empty_char(f, c) for c in name]
				glyph = f.createChar(char, name)
				glyph.addPosSub('liga', tuple(name))
			else:
				glyph = f.createChar(char)
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

# Hint the TTF file
# ttfautohint is optional
if find_executable('ttfautohint'):
	call("ttfautohint --symbol --latin-fallback --no-info '" + fontfile + ".ttf' '" + fontfile + "-hinted.ttf' && mv '" + fontfile + "-hinted.ttf' '" + fontfile + ".ttf'", shell=True)
	f = fontforge.open(fontfile + '.ttf')

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
	call("python '" + scriptPath + "/eotlitetool.py' '" + fontfile + ".ttf' --output '" + fontfile + ".eot'", shell=True)

# Delete TTF if not needed
if not 'ttf' in args.types:
	os.remove(fontfile + '.ttf')

print(json.dumps({'file': fontfile, 'names': files}))
