import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('195.35.22.13', username='root', password='SHASTIKARAM#@97may')

cmd = "sed -i \"s/transport: WebSocket/transport: require('ws')/g\" /var/www/adms-sync/server.js && pm2 restart adms-sync"
_, out, err = ssh.exec_command(cmd)

print("OUT:", out.read().decode('utf-8'))
print("ERR:", err.read().decode('utf-8'))
