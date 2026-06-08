import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('195.35.22.13', 22, 'root', 'SHASTIKARAM#@97may')

stdin, stdout, stderr = ssh.exec_command('cat /var/www/adms-sync/server.js')
server_js = stdout.read().decode('utf-8')

# Fix GET /iclock/cdata.aspx
server_js = server_js.replace("app.get('/iclock/cdata', (req, res) => {", "app.get(['/iclock/cdata', '/iclock/cdata.aspx'], (req, res) => {")

# Fix POST /iclock/cdata.aspx
server_js = server_js.replace("app.post('/iclock/cdata', async (req, res) => {", "app.post(['/iclock/cdata', '/iclock/cdata.aspx'], async (req, res) => {")

# Fix GET /iclock/getrequest.aspx
server_js = server_js.replace("app.get('/iclock/getrequest', (req, res) => {", "app.get(['/iclock/getrequest', '/iclock/getrequest.aspx'], (req, res) => {")

# Fix POST /iclock/devicecmd.aspx
server_js = server_js.replace("app.post('/iclock/devicecmd', (req, res) => {", "app.post(['/iclock/devicecmd', '/iclock/devicecmd.aspx'], (req, res) => {")

sftp = ssh.open_sftp()
with sftp.file('/var/www/adms-sync/server.js', 'w') as f:
    f.write(server_js)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('pm2 restart adms-sync')
print(stdout.read().decode())
print(stderr.read().decode())

print("Node.js server updated to support .aspx endpoints and restarted!")
