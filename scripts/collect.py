"""One public-feed sample per invocation. No scheduler or paid services."""
import datetime
import json
import pathlib
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
URL = 'https://api.openligadb.de/getmatchdata/bl1'
stamp = datetime.datetime.now(datetime.timezone.utc)
start = time.monotonic()
with urllib.request.urlopen(URL, timeout=20) as response:
    data = json.load(response)
if not isinstance(data, list) or not data:
    raise ValueError('Expected a nonempty match list')
sample = {'fetchedAt': stamp.isoformat(), 'source': URL, 'licence': 'ODbL-1.0',
          'durationMs': round((time.monotonic()-start)*1000), 'matches': data}
folder = ROOT / 'data' / 'observations'
folder.mkdir(exist_ok=True)
path = folder / (stamp.strftime('%Y%m%dT%H%M%S%fZ') + '.json')
path.write_text(json.dumps(sample, indent=2, ensure_ascii=False))
print(f'Saved {len(data)} matches to {path}')
