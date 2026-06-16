const { Client } = require('ssh2');

const conn = new Client();

const script = `
echo "=== Checking frontend build locations ==="
ls -la /var/www/ERP/dist/ 2>/dev/null | head -10 || echo "No /var/www/ERP/dist"
ls -la /var/www/shastika-erp/ 2>/dev/null | head -10 || echo "No /var/www/shastika-erp"
ls -la /var/www/html/ 2>/dev/null | head -5

echo ""
echo "=== DNS / domain check ==="
nslookup erp.shastikaglobex.com 2>&1 | head -10 || echo "nslookup not available"

echo ""
echo "=== Check what's on port 443 for erp.shastikaglobex.com ==="
curl -v --max-time 5 https://erp.shastikaglobex.com/ 2>&1 | head -30

echo ""
echo "=== All SSL certs ==="
ls /etc/letsencrypt/live/ 2>/dev/null

echo ""
echo "=== Check if erp.shastikaglobex.com has SSL cert ==="
ls /etc/letsencrypt/live/erp.shastikaglobex.com/ 2>/dev/null || echo "No cert for erp.shastikaglobex.com"
`;

conn.on('ready', () => {
  console.log('🔗 Connected\n');
  conn.exec(script, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).on('error', err => console.error('SSH error:', err.message))
  .connect({ host: '195.35.22.13', port: 22, username: 'root', password: 'SHASTIKARAM@2026', readyTimeout: 15000 });
