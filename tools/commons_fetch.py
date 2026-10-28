# Download Wikimedia Commons images (1280 px thumbnails) with their licence data into a reference folder.
#   python -I tools/commons_fetch.py <folder> <prefix> "File:A.jpg" "File:B.jpg" ...
#   python -I tools/commons_fetch.py <folder> <prefix> --category "Category:Name" [--match regex]
#   python -I tools/commons_fetch.py <folder> --restore     download what <folder>/SOURCES.json lists but the folder lacks
# Appends to <folder>/SOURCES.json; skips files already downloaded; throttles to stay under the rate limit.
import json, os, re, sys, time, urllib.parse, urllib.request

H = {"User-Agent": "HogwartsReplicaRef/1.0 (personal modeling reference)"}
def api(**kw):
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(dict(format='json', **kw))
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=60))

folder, prefix, args = sys.argv[1], sys.argv[2], sys.argv[3:]
os.makedirs(folder, exist_ok=True)
titles = []
restore = prefix == '--restore'   # the open-source repo keeps only SOURCES.json; this brings the photos back
if args and args[0] == '--category':
    cat = args[1]; pat = re.compile(args[3]) if len(args) > 3 and args[2] == '--match' else None
    d = api(action='query', list='categorymembers', cmtitle=cat, cmlimit=500, cmtype='file')
    titles = [x['title'] for x in d['query']['categorymembers'] if not pat or pat.search(x['title'])]
else:
    titles = args
src_path = os.path.join(folder, 'SOURCES.json')
sources = json.load(open(src_path, encoding='utf-8')) if os.path.exists(src_path) else []
have = {s['title'] for s in sources}
n0 = len([s for s in sources if s['file'].startswith(prefix)])
missing = {s['title']: s['file'] for s in sources if not os.path.exists(os.path.join(folder, s['file']))}
todo = list(missing) if restore else [t for t in titles if t not in have]
for i in range(0, len(todo), 40):
    d = api(action='query', titles='|'.join(todo[i:i + 40]), prop='imageinfo', iiprop='url|size|extmetadata', iiurlwidth=1280)
    for p in d['query']['pages'].values():
        if 'imageinfo' not in p: continue
        ii = p['imageinfo'][0]; em = ii.get('extmetadata', {})
        if restore: fn = missing[p['title']]
        else: fn = f"{prefix}{n0:02d}_" + re.sub(r'[^A-Za-z0-9]+', '_', p['title'][5:].rsplit('.', 1)[0]).strip('_')[-34:] + '.jpg'
        n0 += 1
        for k in range(5):
            try:
                data = urllib.request.urlopen(urllib.request.Request(ii.get('thumburl') or ii['url'], headers=H), timeout=60).read()
                open(os.path.join(folder, fn), 'wb').write(data); break
            except Exception as e:
                print('retry', fn, str(e)[:40]); time.sleep(10 * (k + 1))
        if restore:
            print(fn); time.sleep(2.5); continue
        sources.append(dict(title=p['title'], file=fn, page=ii['descriptionurl'], license=em.get('LicenseShortName', {}).get('value'),
                            artist=re.sub('<[^>]+>', '', em.get('Artist', {}).get('value', ''))[:100]))
        print(fn, sources[-1]['license'])
        time.sleep(2.5)
json.dump(sources, open(src_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('total', len(sources))
