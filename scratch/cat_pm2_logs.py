import sys
import paramiko

# Reconfigure stdout/stderr for UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

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
        stdin, stdout, stderr = ssh.exec_command("cat /root/.pm2/logs/adms-sync-error.log | tail -n 50")
        print(stdout.read().decode('utf-8'))
        
        print("\n--- Out Log Tail ---")
        stdin, stdout, stderr = ssh.exec_command("cat /root/.pm2/logs/adms-sync-out.log | tail -n 50")
        print(stdout.read().decode('utf-8'))
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
