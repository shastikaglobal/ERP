import paramiko

VPS_IP = "195.35.22.13"
VPS_PORT = 22
VPS_USER = "root"
PASSWORD = "SHASTIKARAM#@97may"

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=PASSWORD, timeout=15)
    
    commands = [
        "pm2 delete adms-sync",
        "pm2 delete adms",
        "cd /var/www/adms-sync && npm install ws dotenvx node-fetch@2",
        "cd /var/www/adms-sync && pm2 start server.js --name adms-sync",
        "pm2 save"
    ]
    
    with open('scratch/pm2_fix.txt', 'w', encoding='utf-8') as f:
        for cmd in commands:
            f.write(f"Executing: {cmd}\n")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            f.write(stdout.read().decode('utf-8'))
            f.write(stderr.read().decode('utf-8'))
            f.write("\n")
    
    ssh.close()

if __name__ == "__main__":
    main()
