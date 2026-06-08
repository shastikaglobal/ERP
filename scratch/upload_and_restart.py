import paramiko
import os

VPS_IP = "195.35.22.13"
VPS_PORT = 22
VPS_USER = "root"
PASSWORD = "SHASTIKARAM#@97may"

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=PASSWORD, timeout=15)
    
    # SFTP
    sftp = ssh.open_sftp()
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # The adms-sync/server.js is the one to upload
    local_server_js = os.path.abspath(os.path.join(current_dir, '..', 'adms-sync', 'server.js'))
    
    print("Uploading updated server.js to VPS...")
    sftp.put(local_server_js, '/var/www/adms-sync/server.js')
    sftp.close()
    
    print("Restarting adms-sync PM2 process...")
    stdin, stdout, stderr = ssh.exec_command("pm2 restart adms-sync")
    print(stdout.read().decode('utf-8'))
    print(stderr.read().decode('utf-8'))
    
    ssh.close()

if __name__ == "__main__":
    main()
