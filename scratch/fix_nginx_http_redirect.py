import sys
import paramiko
import io

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
        
        # Read the current shastika config
        stdin, stdout, stderr = ssh.exec_command("cat /etc/nginx/sites-enabled/shastika")
        config = stdout.read().decode('utf-8')
        
        # We need to replace the listen 80 block to NOT redirect /iclock/
        # Let's write the clean version of the shastika nginx config
        new_config = """server {
    server_name shastikaglobal.co.in www.shastikaglobal.co.in;

    location /iclock/ {
        proxy_pass http://127.0.0.1:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/shastikaglobal.co.in/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/shastikaglobal.co.in/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    listen 80;
    server_name shastikaglobal.co.in www.shastikaglobal.co.in;

    location /iclock/ {
        proxy_pass http://127.0.0.1:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    location / {
        if ($host = www.shastikaglobal.co.in) {
            return 301 https://$host$request_uri;
        }
        if ($host = shastikaglobal.co.in) {
            return 301 https://$host$request_uri;
        }
        return 404;
    }
}
"""
        sftp = ssh.open_sftp()
        sftp.putfo(io.BytesIO(new_config.encode('utf-8')), '/etc/nginx/sites-available/shastika')
        sftp.close()
        
        print("Updated Nginx config at /etc/nginx/sites-available/shastika")
        
        # Test and reload Nginx
        stdin, stdout, stderr = ssh.exec_command("nginx -t && systemctl reload nginx")
        print("Reload result:", stdout.read().decode('utf-8').strip(), stderr.read().decode('utf-8').strip())

        # Let's perform a local HTTP check from local PC to the public URL to ensure it doesn't redirect anymore!
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
