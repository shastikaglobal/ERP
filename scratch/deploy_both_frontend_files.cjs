const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

const dashboardCode = fs.readFileSync('d:/ERP/ERP/src/pages/warehouse/WarehouseDashboard.tsx', 'utf8');
const receivingCode = fs.readFileSync('d:/ERP/ERP/src/pages/warehouse/ReceivingGoods.tsx', 'utf8');
const batchStockCode = fs.readFileSync('d:/ERP/ERP/src/pages/inventory/BatchWiseStock.tsx', 'utf8');

const script = `
cat << 'EOF' > /var/www/erp/src/pages/warehouse/WarehouseDashboard.tsx
${dashboardCode.replace(/\$/g, '\\$')}
EOF

cat << 'EOF' > /var/www/erp/src/pages/warehouse/ReceivingGoods.tsx
${receivingCode.replace(/\$/g, '\\$')}
EOF

cat << 'EOF' > /var/www/erp/src/pages/inventory/BatchWiseStock.tsx
${batchStockCode.replace(/\$/g, '\\$')}
EOF

cd /var/www/erp
npm run build
`;

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Frontend deployment stream closed with code: ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026',
  algorithms: {
    serverHostKey: ['ssh-ed25519', 'ssh-rsa', 'ecdsa-sha2-nistp256']
  }
});
