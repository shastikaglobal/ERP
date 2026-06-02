import sys
from zk import ZK

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

candidates = ['192.168.1.3', '192.168.1.4', '192.168.1.5', '192.168.1.7', '192.168.1.11', '192.168.1.23', '192.168.1.27']
for ip in candidates:
    print(f"\n📡 Trying ZK connection to {ip} on port 4370...")
    for use_udp in [False, True]:
        print(f"  Trying with force_udp={use_udp}...")
        try:
            zk = ZK(ip, port=4370, timeout=1.5, force_udp=use_udp)
            conn = zk.connect()
            print(f"  🎉 SUCCESS! Connected to {ip} with force_udp={use_udp}")
            conn.disconnect()
        except Exception as e:
            print(f"  ❌ Failed: {e}")
