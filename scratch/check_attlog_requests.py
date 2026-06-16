import paramiko
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

password = 'SHASTIKARAM@2026'
VPS_IP = '195.35.22.13'
VPS_PORT = 22
VPS_USER = 'root'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=password, timeout=15)

commands = [
    ('Nginx ATTLOG or POST requests in last 2 days', 'cat /var/log/nginx/access.log | grep -E "POST|ATTLOG|cdata" | tail -n 50'),
    ('Daily count of /iclock/ requests', 'cat /var/log/nginx/access.log | grep iclock | awk \'{print $4}\' | cut -d: -f1 | sort | uniq -c')
]

for title, cmd in commands:
    print('\n' + '='*50)
    print(title)
    stdin, stdout, stderr = ssh.exec_command(cmd)
    try:
        print(stdout.read().decode('utf-8', errors='replace'))
    except Exception as e:
        print("Error reading output:", e)
ssh.close()
