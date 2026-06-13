import sys
import paramiko

VPS_IP = "195.35.22.13"
VPS_PORT = 22
VPS_USER = "root"
password = "SHASTIKARAM@2026"

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=password, timeout=15)
        print("Connected.")
        
        # Stop and delete conflicting PM2 processes
        print("Deleting conflicting PM2 processes...")
        ssh.exec_command("pm2 delete server")
        ssh.exec_command("pm2 delete adms-sync")
        
        # Start a single clean process
        print("Starting adms-sync process...")
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/adms-sync && pm2 start server.js --name \"adms-sync\"")
        print(stdout.read().decode('utf-8'))
        
        # Save process list
        stdin, stdout, stderr = ssh.exec_command("pm2 save")
        print(stdout.read().decode('utf-8'))
        
        # Check final status
        stdin, stdout, stderr = ssh.exec_command("pm2 status")
        print("\n--- Final PM2 Status ---")
        print(stdout.read().decode('utf-8'))

    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
