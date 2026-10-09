"""Generate small, self-hosted OFL font subsets for the fixed game UI.
Install tools locally: python -m pip install --target .font-build fonttools brotli
Font sources: google/fonts, ofl/zenmarugothic/ZenMaruGothic-{Medium,Bold}.ttf
Run again after adding Japanese copy. Name the subsets Forest Maru to avoid
reusing reserved font names. Original copyright and license records are retained.
"""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.font-build'))
from fontTools import subset
from fontTools.ttLib import TTFont

copy = ''.join(path.read_text(encoding='utf-8') for path in (ROOT / 'src').glob('*.ts'))
copy += (ROOT / 'index.html').read_text(encoding='utf-8')
for weight, name in [(500, 'Medium'), (700, 'Bold')]:
    font = TTFont(ROOT / 'art' / 'source' / f'ZenMaruGothic-{name}.ttf')
    options = subset.Options()
    options.flavor = 'woff2'
    options.name_IDs = ['*']
    options.name_legacy = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=copy)
    subsetter.subset(font)
    for record in font['name'].names:
        if record.nameID in [1, 2, 3, 4, 6, 16, 17]:
            replacement = 'Forest Maru' if record.nameID in [1, 16] else name if record.nameID in [2, 17] else f'ForestMaru-{name}'
            record.string = replacement.encode(record.getEncoding())
    font.flavor = 'woff2'
    output = ROOT / 'public' / 'assets' / f'forest-maru-{weight}.woff2'
    font.save(output)
    print(f'{output.name}: {output.stat().st_size:,} bytes')
