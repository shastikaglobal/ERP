import subprocess
import threading
import sys
import platform

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

active_ips = []
lock = threading.Lock()

def ping_ip(ip):
    # Determine the ping parameter based on the OS
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    # Build the command, e.g., "ping -n 1 -w 500 192.168.1.1"
    command = ['ping', param, '1', '-w', '1000', ip]
    
    # Run the ping command
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode == 0:
        with lock:
            print(f"🟢 {ip} is ONLINE")
            active_ips.append(ip)

print("Scanning subnet 192.168.1.1 - 254 with ICMP ping concurrently...")
threads = []
for i in range(1, 255):
    ip = f"192.168.1.{i}"
    t = threading.Thread(target=ping_ip, args=(ip,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print(f"\nScan complete. Active IPs ({len(active_ips)}):")
print(sorted(active_ips))
