import urllib.request
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ips = ['192.168.1.6', '192.168.1.100', '192.168.1.101']
for ip in ips:
    url = f"http://{ip}"
    print(f"\n🌐 Accessing {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=2.0) as response:
            html = response.read().decode('utf-8', errors='ignore')
            print(f"  Status Code: {response.status}")
            print(f"  First 1000 chars:\n{html[:1000].strip()}\n---")
    except Exception as e:
        print(f"  ❌ Error: {e}")
