import paramiko
import sys

VPS_IP = "195.35.22.13"
VPS_PORT = 22
VPS_USER = "root"
PASSWORD = "SHASTIKARAM#@97may"

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=PASSWORD, timeout=15)
    
    # Check what is in server.js
    stdin, stdout, stderr = ssh.exec_command("cat /var/www/adms-sync/server.js | head -n 30")
    with open('scratch/test_out.txt', 'w', encoding='utf-8') as f:
        f.write("--- SERVER.JS ---\n")
        f.write(stdout.read().decode('utf-8'))
    
    # Run node server.js directly
    stdin, stdout, stderr = ssh.exec_command("cd /var/www/adms-sync && node server.js")
    with open('scratch/test_out.txt', 'a', encoding='utf-8') as f:
        f.write("--- NODE OUTPUT ---\n")
        f.write(stdout.read().decode('utf-8'))
        f.write("--- NODE ERR ---\n")
        f.write(stderr.read().decode('utf-8'))
    
    ssh.close()

if __name__ == "__main__":
    main()
