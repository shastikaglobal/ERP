const { Client } = require('ssh2');

const conn = new Client();

const script = `
echo "=== Nginx Status ==="
systemctl status nginx --no-pager | head -5

echo ""
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Nginx Config Test ==="
nginx -t 2>&1

echo ""
echo "=== Port Checks ==="
ss -tlnp | grep -E '80|443|3001|8082|8080'

echo ""
echo "=== Last 20 Nginx Error Logs ==="
tail -20 /var/log/nginx/error.log 2>/dev/null || echo "No nginx error log"

echo ""
echo "=== Last 20 adms-sync PM2 Logs ==="
pm2 logs adms-sync --lines 20 --nostream 2>&1 | tail -25

echo ""
echo "=== erp-api PM2 Logs ==="
pm2 logs erp-api --lines 15 --nostream 2>&1 | tail -20

echo ""
echo "=== Nginx Site Config ==="
cat /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/conf.d/*.conf 2>/dev/null
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
  .connect({
    host: '195.35.22.13',
    port: 22,
    username: 'root',
    password: 'SHASTIKARAM@2026',
    readyTimeout: 15000,
  });
