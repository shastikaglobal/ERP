import paramiko
import re

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('195.35.22.13', username='root', password='SHASTIKARAM#@97may', timeout=15)

_, out, _ = ssh.exec_command('cat /var/www/adms-sync/server.js')
content = out.read().decode('utf-8')

# The regex will match:
# realtime: {
#     transport: require('ws')
# }
# no matter the line endings or spacing

pattern = re.compile(r"realtime:\s*\{\s*transport:\s*(?:require\('ws'\)|WebSocket)\s*\}", re.MULTILINE)
replacement = "auth: { persistSession: false }, global: { fetch: fetch, WebSocket: require('ws') }"

new_content = pattern.sub(replacement, content)

sftp = ssh.open_sftp()
with sftp.file('/var/www/adms-sync/server.js', 'w') as f:
    f.write(new_content)
sftp.close()

_, out2, err2 = ssh.exec_command('pm2 restart adms-sync')
# Read pm2 output, ignoring decoding errors to avoid crashing on checkmarks
print("RESTART OUT:", out2.read().decode('utf-8', errors='ignore'))
print("RESTART ERR:", err2.read().decode('utf-8', errors='ignore'))

# Flush the pm2 logs so we don't read old errors
ssh.exec_command('pm2 flush')

ssh.close()
