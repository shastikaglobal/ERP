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
        print("✅ SSH Connection to VPS successful!")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return

    commands = [
        ("pm2 status", "pm2 status"),
        ("pm2 logs --lines 50 --no-colors", "pm2 logs adms-sync --limit 50 --raw --no-color"),
        ("error log", "cat /root/.pm2/logs/adms-sync-error.log | tail -n 50"),
        ("out log", "cat /root/.pm2/logs/adms-sync-out.log | tail -n 50"),
        ("nginx status", "systemctl status nginx")
    ]

    for title, cmd in commands:
        print("\n" + "=" * 50)
        print(f"📋 {title} ({cmd})")
        print("=" * 50)
        try:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            exit_status = stdout.channel.recv_exit_status()
            out = stdout.read().decode('utf-8').strip()
            err = stderr.read().decode('utf-8').strip()
            if out:
                print(out)
            if err:
                print(f"Stderr:\n{err}")
        except Exception as e:
            print(f"Error: {e}")

    ssh.close()

if __name__ == "__main__":
    main()
