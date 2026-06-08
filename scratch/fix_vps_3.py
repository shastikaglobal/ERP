import paramiko
import re

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('195.35.22.13', username='root', password='SHASTIKARAM#@97may', timeout=15)

_, out, _ = ssh.exec_command('cat /var/www/adms-sync/server.js')
content = out.read().decode('utf-8')

# Use regex to match regardless of \r\n or \n
pattern = re.compile(r"realtime:\s*\{\s*transport:\s*WebSocket\s*\}", re.MULTILINE)
replacement = "auth: { persistSession: false }, global: { fetch: fetch, WebSocket: WebSocket }"

new_content = pattern.sub(replacement, content)

sftp = ssh.open_sftp()
with sftp.file('/var/www/adms-sync/server.js', 'w') as f:
    f.write(new_content)
sftp.close()

_, out2, err2 = ssh.exec_command('pm2 restart adms-sync')
print("RESTART OUT:", out2.read().decode('utf-8'))
print("RESTART ERR:", err2.read().decode('utf-8'))

ssh.close()
