import paramiko
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

password = 'SHASTIKARAM@2026'
VPS_IP = '195.35.22.13'
VPS_PORT = 22
VPS_USER = 'root'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=password, timeout=15)

files_to_read = [
    '/etc/nginx/sites-enabled/shastika',
    '/etc/nginx/sites-enabled/erp',
    '/etc/nginx/sites-enabled/globalairtech.co.in'
]

for file_path in files_to_read:
    print('\n' + '='*50)
    print(f"File: {file_path}")
    stdin, stdout, stderr = ssh.exec_command(f'cat {file_path}')
    try:
        print(stdout.read().decode('utf-8', errors='replace'))
    except Exception as e:
        print("Error reading file:", e)

ssh.close()
