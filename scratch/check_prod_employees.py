import paramiko, sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('195.35.22.13', 22, 'root', 'SHASTIKARAM@2026', timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='replace').strip()

print("=== PRODUCTION employees.js (last 60 lines) ===")
print(run("tail -60 /var/www/adms-sync/routes/employees.js"))

print("\n=== PM2 ERROR LOG (last 30 lines) ===")
print(run("tail -30 /root/.pm2/logs/adms-sync-error.log"))

ssh.close()
