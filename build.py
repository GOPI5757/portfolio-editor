"""Build the offline editor. No network or additional Python packages needed."""
from pathlib import Path
import re

root=Path(__file__).resolve().parent
source=root/('source' if (root/'source').exists() else 'dist')
html=(source/'index.html').read_text(encoding='utf-8')
css=(source/'studio.css').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="studio.css">','<style>'+css+'</style>')
def embed(match):
    code=(source/match.group(1)).read_text(encoding='utf-8')
    code=re.sub(r'</script',r'<\\/script',code,flags=re.I)
    return '<script>\n'+code+'\n</script>'
html=re.sub(r'<script src="([^"]+)"></script>',embed,html)
licenses='\n\n'.join((source/'vendor'/name).read_text(encoding='utf-8') for name in ['ACORN-LICENSE.txt','JSZIP-LICENSE.md'])
html=html.replace('<head>','<head>\n<!--\nBundled library notices:\n'+licenses.replace('--','- -')+'\n-->\n')
output=root/'index.html'
output.write_text(html,encoding='utf-8')
print(f'Built {output.name}: {output.stat().st_size:,} bytes')
