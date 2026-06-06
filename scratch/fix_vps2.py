import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('195.35.22.13', username='root', password='SHASTIKARAM#@97may')

_, out, _ = ssh.exec_command('cat /var/www/adms-sync/server.js')
content = out.read().decode('utf-8')

# Supabase >v2 uses global: { WebSocket } instead of realtime: { transport: WebSocket }
# Also add auth: { persistSession: false } for server-side
content = content.replace(
    "realtime: {\n    transport: require('ws')\n  }",
    "auth: { persistSession: false }, global: { fetch: fetch, WebSocket: require('ws') }"
)
content = content.replace(
    "realtime: {\n    transport: WebSocket\n  }",
    "auth: { persistSession: false }, global: { fetch: fetch, WebSocket: require('ws') }"
)

sftp = ssh.open_sftp()
with sftp.file('/var/www/adms-sync/server.js', 'w') as f:
    f.write(content)

_, out2, err2 = ssh.exec_command('pm2 restart adms-sync')
print("OUT:", out2.read().decode('utf-8'))
