import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('195.35.22.13', 22, 'root', 'SHASTIKARAM#@97may')

config = """server {
    listen 80;
    listen [::]:80;
    listen 8081;
    listen [::]:8081;

    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;

    server_name _;

    location /iclock/ {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}"""

sftp = ssh.open_sftp()
with sftp.file('/etc/nginx/sites-available/default', 'w') as f:
    f.write(config)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('rm -f /etc/nginx/sites-enabled/default_server')
stdout.channel.recv_exit_status()

stdin, stdout, stderr = ssh.exec_command('ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default')
stdout.channel.recv_exit_status()

stdin, stdout, stderr = ssh.exec_command('systemctl restart nginx')
print(stdout.read().decode())
print(stderr.read().decode())

print("Nginx updated to listen on port 80 and 8081.")
