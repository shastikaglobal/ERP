import paramiko

VPS_IP = "195.35.22.13"
VPS_PORT = 22
VPS_USER = "root"
PASSWORD = "SHASTIKARAM#@97may"

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=PASSWORD, timeout=15)
    
    # 1. Delete the bad adms config which listens on 8082
    ssh.exec_command("rm -f /etc/nginx/sites-enabled/adms")
    ssh.exec_command("rm -f /etc/nginx/sites-available/adms")
    
    # 2. Restart Nginx to release port 8082
    ssh.exec_command("systemctl restart nginx")
    
    # 3. Restart PM2 so Node can bind to port 8082
    ssh.exec_command("pm2 restart adms-sync")
    
    # Wait for PM2 to start
    import time
    time.sleep(3)
    
    # 4. Check pm2 status and curl
    stdin, stdout, stderr = ssh.exec_command("pm2 status adms-sync && curl -i http://localhost/iclock/cdata?SN=TEST")
    with open('scratch/nginx_fix_out.txt', 'w', encoding='utf-8') as f:
        f.write(stdout.read().decode('utf-8'))
        f.write("\n--- ERR ---\n")
        f.write(stderr.read().decode('utf-8'))
    
    ssh.close()

if __name__ == "__main__":
    main()
