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
        ("Nginx Config", "cat /etc/nginx/sites-enabled/default || cat /etc/nginx/nginx.conf"),
        ("Var WWW List", "ls -la /var/www"),
        ("Var WWW HTML List", "ls -la /var/www/html || true"),
        ("PM2 list", "pm2 status")
    ]
    
    for title, cmd in commands:
        print(f"\n=== {title} ===")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print(stdout.read().decode('utf-8'))
        err = stderr.read().decode('utf-8')
        if err:
            print(f"Error: {err}")
            
    ssh.close()

if __name__ == "__main__":
    main()
