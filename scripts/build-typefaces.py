"""Subset the upstream Noto SC fonts for the site's bundled text.

Requires fonttools and brotli. Pass the directory containing notosanssc.ttf,
notoserifsc.ttf and the corresponding *-OFL.txt files from google/fonts.
Run package-codex-source.py afterwards to refresh the cache keys.
"""

import argparse
from pathlib import Path
from shutil import copyfile

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'


def save_subset(upstream, output, family, weight, glyphs):
    font = TTFont(upstream)
    options = subset.Options()
    options.name_IDs = ['*']
    options.name_languages = ['*']
    generator = subset.Subsetter(options=options)
    generator.populate(unicodes=glyphs)
    generator.subset(font)
    font = instantiateVariableFont(font, {'wght': weight}, inplace=True)
    subfamily = 'Semibold' if isinstance(weight, int) else 'Regular'
    postscript_family = family.replace(' ', '')
    names = {
        1: family, 2: subfamily, 3: f'{family} {subfamily}',
        4: f'{family} {subfamily}', 6: f'{postscript_family}-{subfamily}',
        16: family, 17: subfamily, 25: postscript_family,
    }
    for name in font['name'].names:
        if name.nameID in names:
            name.string = names[name.nameID]

    font.flavor = 'woff2'
    font.save(output)
    print(f'{output.name}: {len(font.getBestCmap())} characters, {output.stat().st_size:,} bytes')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('upstream', type=Path, help='Directory containing original fonts and licenses')
    upstream = parser.parse_args().upstream
    files = [DIST / 'index.html', *sorted(DIST.glob('*.js'))]
    glyphs = set(range(32, 127))
    for path in files:
        glyphs.update(ord(char) for char in path.read_text(encoding='utf-8') if char.isprintable())

    target = DIST / 'fonts'
    target.mkdir(exist_ok=True)
    for original, asset, family, weight in [
        ('notosanssc', 'atlas-sans', 'Atlas Sans', (400, 700)),
        ('notoserifsc', 'atlas-serif', 'Atlas Serif', 600),
    ]:
        save_subset(upstream / f'{original}.ttf', target / f'{asset}.woff2', family, weight, glyphs)
        copyfile(upstream / f'{original}-OFL.txt', target / f'{asset}-OFL.txt')


if __name__ == '__main__':
    main()
