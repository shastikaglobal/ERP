import paramiko

VPS_IP = "195.35.22.13"
VPS_PORT = 22
VPS_USER = "root"
PASSWORD = "SHASTIKARAM#@97may"

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=PASSWORD, timeout=15)
    
    stdin, stdout, stderr = ssh.exec_command("pm2 status")
    with open('scratch/pm2_check.txt', 'w', encoding='utf-8') as f:
        f.write("--- PM2 STATUS ---\n")
        f.write(stdout.read().decode('utf-8'))
        
    stdin, stdout, stderr = ssh.exec_command("pm2 logs adms-sync --lines 20 --nostream")
    with open('scratch/pm2_check.txt', 'a', encoding='utf-8') as f:
        f.write("\n--- PM2 LOGS ---\n")
        f.write(stdout.read().decode('utf-8'))
    
    ssh.close()

if __name__ == "__main__":
    main()
