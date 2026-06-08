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
    
    cmd = "ls -la /root/.pm2/logs/"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8'))
        
    ssh.close()

if __name__ == "__main__":
    main()
