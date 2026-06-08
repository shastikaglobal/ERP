import paramiko
import sys

VPS_IP = "195.35.22.13"
VPS_PORT = 22
VPS_USER = "root"
PASSWORD = "SHASTIKARAM#@97may"

def main():
    print("Connecting to VPS...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=PASSWORD, timeout=15)
        print("Connected!")
    except Exception as e:
        print(f"Failed to connect: {e}")
        sys.exit(1)

    print("Fetching PM2 logs for adms-sync...")
    
    # Grep without emojis
    cmd = "cat /root/.pm2/logs/adms-sync-out.log* | grep -E 'Logged Clock-In|Updated attendance'"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    logs = stdout.read().decode('utf-8')
    
    print("Fetched logs length:", len(logs))
    
    with open('scratch/fetched_pm2_logs.txt', 'w', encoding='utf-8') as f:
        f.write(logs)
        
    print("Saved to scratch/fetched_pm2_logs.txt")
    ssh.close()

if __name__ == "__main__":
    main()
