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
        
        # Check current date on VPS
        stdin, stdout, stderr = ssh.exec_command("date")
        print("VPS current time:", stdout.read().decode('utf-8').strip())

        # Check latest 10 lines of pm2 logs
        stdin, stdout, stderr = ssh.exec_command("pm2 logs adms-sync --lines 10 --no-colors")
        print("\n--- PM2 Logs ---")
        print(stdout.read().decode('utf-8'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
