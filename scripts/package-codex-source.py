"""Create an allowlisted, credential-free source snapshot for Codex."""
from pathlib import Path
from hashlib import sha256
import re
from zipfile import ZIP_DEFLATED, ZipFile
root = Path(__file__).resolve().parents[1]
assets = ['styles.css', 'data.js', 'micro-data.js', 'deep-data.js', 'expansion-data.js',
          'app.js', 'enrichment.js', 'reader.js', 'research-data.js', 'research-ui.js', 'relations.js',
          'navigation.js']
font_assets = ['fonts/atlas-sans.woff2', 'fonts/atlas-serif.woff2']
style_path = root / 'dist/styles.css'
style = style_path.read_text(encoding='utf-8')
for asset in font_assets:
    digest = sha256((root / 'dist' / asset).read_bytes()).hexdigest()[:16]
    pattern = r'(url\(")' + re.escape(asset) + r'(?:\?[^"\s]*)?("\))'
    style, count = re.subn(pattern, lambda m: m.group(1) + asset + '?v=' + digest + m.group(2), style)
    if count != 1:
        raise ValueError(f'Expected exactly one font reference to {asset}, found {count}')
style_path.write_text(style, encoding='utf-8', newline='\n')
# Every packaged version points to the exact asset bytes it contains. Updating an
# asset changes its URL so an existing browser cannot reuse an older cached copy.
index_path = root / 'dist/index.html'
index = index_path.read_text(encoding='utf-8')
for asset in assets:
    asset_path = root / 'dist' / asset
    original = asset_path.read_bytes()
    # Git stores these text assets with LF. Normalize before hashing so the
    # version also matches a clean checkout or an archive made from the commit.
    content = original.replace(b'\r\n', b'\n')
    if content != original:
        asset_path.write_bytes(content)
    digest = sha256(content).hexdigest()[:16]
    pattern = r'((?:src|href)=")' + re.escape(asset) + r'(?:\?[^"\s]*)?("\s*[^>]*>)'
    index, count = re.subn(pattern, lambda m: m.group(1) + asset + '?v=' + digest + m.group(2), index)
    if count != 1:
        raise ValueError(f'Expected exactly one reference to {asset}, found {count}')
index_path.write_text(index, encoding='utf-8', newline='\n')
files = ['.gitattributes', '.openai/hosting.json', 'README.md', 'CODEX_HANDOFF.md',
         'PROJECT_PLAN.md', 'PROGRESS.md', 'NEXT_ACTIONS.md', 'SOURCES.md', 'KNOWLEDGE_COVERAGE.json',
         'content/research.json', 'content/expansion.json', 'content/legacy-reviews.json', 'scripts/package-codex-source.py', 'scripts/audit.mjs',
         'scripts/build-research.mjs', 'scripts/build-expansion.mjs', 'scripts/create-coverage.mjs',
         'tests/study-data.mjs', 'tests/reader-render.mjs', 'tests/research-data.mjs', 'tests/relations.mjs', 'tests/legacy-review.mjs', 'tests/asset-versions.mjs', 'tests/import-conflicts.mjs', 'tests/browser-import.cjs', 'tests/browser-navigation.cjs', 'tests/browser-reader-content.cjs', 'tests/browser-library.cjs', 'tests/reading-paths.mjs', 'tests/browser-paths.cjs', 'tests/browser-review.cjs', 'tests/browser-map-reading.cjs', 'tests/browser-history.cjs', 'tests/browser-sources.cjs', 'tests/browser-comparisons.cjs', 'tests/comparison-data.mjs', 'tests/browser-hr-records.cjs', 'tests/browser-reader-directory.cjs']
files += [f'dist/{name}' for name in ['index.html', 'styles.css', 'data.js', 'micro-data.js',
          'deep-data.js', 'expansion-data.js', 'app.js', 'enrichment.js', 'reader.js', 'research-data.js', 'research-ui.js', 'relations.js', 'navigation.js']]
files += ['scripts/build-typefaces.py', *(f'dist/{name}' for name in font_assets),
          'dist/fonts/atlas-sans-OFL.txt', 'dist/fonts/atlas-serif-OFL.txt']
output = root / 'dist/codex-source.zip'
with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
    for name in files:
        archive.write(root / name, name)
print(f'Source package: {len(files)} allowlisted files; {output.stat().st_size} bytes')
