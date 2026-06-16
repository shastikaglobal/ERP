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

# Get the last 100 entries of the access log
stdin, stdout, stderr = ssh.exec_command('tail -n 100 /var/log/nginx/access.log')
print("--- LAST 100 NGINX ACCESS LOG ENTRIES ---")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
