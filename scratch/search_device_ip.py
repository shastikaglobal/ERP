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
    ('Check IP 106.200 in current access.log', 'cat /var/log/nginx/access.log | grep "106.200" | tail -n 30'),
    ('Check IP 106.200 in access.log.1', 'cat /var/log/nginx/access.log.1 | grep "106.200" | tail -n 30'),
    ('Check recent connections from 106.200 in all logs', 'zgrep "106.200" /var/log/nginx/access.log* | tail -n 30')
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
