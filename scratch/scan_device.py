import socket
import threading
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

found_ips = []
lock = threading.Lock()

def check_ip(ip):
    # Check port 4370 (biometric SDK port)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        result = s.connect_ex((ip, 4370))
        s.close()
        if result == 0:
            with lock:
                print(f"🌟 Found device listening on TCP port 4370 at {ip}")
                found_ips.append((ip, 4370))
                return
    except Exception:
        pass

    # Check port 80 (web server)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        result = s.connect_ex((ip, 80))
        s.close()
        if result == 0:
            with lock:
                print(f"🌐 Found device listening on HTTP port 80 at {ip}")
                found_ips.append((ip, 80))
                return
    except Exception:
        pass

print("Scanning subnet 192.168.1.1 - 254 concurrently for ports 4370 and 80...")
threads = []
for i in range(1, 255):
    ip = f"192.168.1.{i}"
    t = threading.Thread(target=check_ip, args=(ip,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

if not found_ips:
    print("❌ No devices found listening on port 4370 or 80.")
else:
    print(f"Scan complete. Found: {found_ips}")
