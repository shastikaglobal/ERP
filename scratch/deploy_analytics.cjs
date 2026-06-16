const { Client } = require('ssh2');
const fs = require('fs');

const analyticsCode = fs.readFileSync('d:/ERP/ERP/adms-sync/routes/analytics.js', 'utf8');

const script = `
echo "=== Deploying fixed analytics.js to VPS ==="
cat > /var/www/adms-sync/routes/analytics.js << 'ENDOFFILE'
${analyticsCode}
ENDOFFILE
echo "✅ analytics.js deployed"
pm2 restart adms-sync
echo "✅ adms-sync restarted"
sleep 2
pm2 status adms-sync | grep adms
`;

const conn = new Client();
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
