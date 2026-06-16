const { Client } = require('ssh2');

const conn = new Client();

// Nginx server block for erp.shastikaglobex.com
const nginxConfig = `server {
    server_name erp.shastikaglobex.com www.erp.shastikaglobex.com;

    root /var/www/shastika-erp;
    index index.html;

    location /iclock/ {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    location /api/ {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    listen 80;
}`;

const script = `
echo "=== Step 1: Check if shastikaglobalexport.co.in is working ==="
curl -s -o /dev/null -w "%{http_code}" https://shastikaglobalexport.co.in/ 2>&1

echo ""
echo "=== Step 2: Check /var/www/shastika-erp build date and index.html ==="
ls -la /var/www/shastika-erp/
echo "--- index.html head ---"
head -5 /var/www/shastika-erp/index.html 2>/dev/null

echo ""
echo "=== Step 3: Writing nginx config for erp.shastikaglobex.com ==="
cat > /etc/nginx/sites-available/erp-shastikaglobex << 'NGINXEOF'
${nginxConfig}
NGINXEOF

ln -sf /etc/nginx/sites-available/erp-shastikaglobex /etc/nginx/sites-enabled/erp-shastikaglobex 2>/dev/null || true

echo "=== Step 4: Test nginx config ==="
nginx -t 2>&1

echo ""
echo "=== Step 5: Reload nginx ==="
systemctl reload nginx && echo "✅ Nginx reloaded" || echo "❌ Nginx reload failed"

echo ""
echo "=== VPS IP (user needs to add DNS A record pointing here) ==="
curl -s ifconfig.me
echo ""
echo ""
echo "=== Done! User must add DNS: erp.shastikaglobex.com → 195.35.22.13 ==="
echo "=== Then run: certbot --nginx -d erp.shastikaglobex.com ==="
`;

conn.on('ready', () => {
  console.log('🔗 Connected to VPS\n');
  conn.exec(script, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).on('error', err => console.error('SSH error:', err.message))
  .connect({ host: '195.35.22.13', port: 22, username: 'root', password: 'SHASTIKARAM@2026', readyTimeout: 15000 });
