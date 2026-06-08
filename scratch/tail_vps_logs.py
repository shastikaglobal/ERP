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
    
    cmd = "tail -n 200 /root/.pm2/logs/adms-sync-out.log"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    logs = stdout.read().decode('utf-8')
    
    with open('scratch/vps_tail.txt', 'w', encoding='utf-8') as f:
        f.write(logs)
        
    ssh.close()

if __name__ == "__main__":
    main()
