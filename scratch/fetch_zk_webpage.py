import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

url = "http://192.168.1.6"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=5.0) as response:
        html = response.read().decode('utf-8', errors='ignore')
        print(html)
except Exception as e:
    print(f"❌ Error: {e}")
