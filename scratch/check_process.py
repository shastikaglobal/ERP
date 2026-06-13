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
        
        # Check node processes
        stdin, stdout, stderr = ssh.exec_command("ps aux | grep node")
        print("\n--- Node Processes ---")
        print(stdout.read().decode('utf-8'))
        
        # Curl local ADMS port
        stdin, stdout, stderr = ssh.exec_command("curl -i http://127.0.0.1:8082/iclock/cdata?SN=TEST")
        print("\n--- Curl Result ---")
        print(stdout.read().decode('utf-8'))
        
        # Check system logs or pm2 logs with tail -n 200
        stdin, stdout, stderr = ssh.exec_command("tail -n 100 /root/.pm2/logs/adms-sync-error.log")
        print("\n--- Error Log tail (100 lines) ---")
        print(stdout.read().decode('utf-8'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
