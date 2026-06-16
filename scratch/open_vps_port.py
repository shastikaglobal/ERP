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
    ('Allow port 8081/tcp in UFW', 'ufw allow 8081/tcp'),
    ('Reload UFW', 'ufw reload'),
    ('Verify UFW Status', 'ufw status')
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
