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
    ('UFW Status', 'ufw status'),
    ('Iptables port 8081 check', 'iptables -L -n -v | grep 8081'),
    ('Listening Ports on VPS', 'netstat -tuln | grep -E "80|8081|8082"')
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
