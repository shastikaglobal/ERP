const { Client } = require('ssh2');
const fs = require('fs');

const employeesCode = fs.readFileSync('d:/ERP/ERP/adms-sync/routes/employees.js', 'utf8');
const permissionsCode = fs.readFileSync('d:/ERP/ERP/adms-sync/routes/permissions.js', 'utf8');
const serverCode = fs.readFileSync('d:/ERP/ERP/adms-sync/server.js', 'utf8');

// Escape $ for heredoc
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

const script = `
echo "=== Deploying fixed adms-sync routes to VPS ==="

cat > /var/www/adms-sync/routes/employees.js << 'ENDOFFILE'
${employeesCode}
ENDOFFILE
echo "✅ employees.js deployed"

cat > /var/www/adms-sync/routes/permissions.js << 'ENDOFFILE'
${permissionsCode}
ENDOFFILE
echo "✅ permissions.js deployed"

cat > /var/www/adms-sync/server.js << 'ENDOFFILE'
${serverCode}
ENDOFFILE
echo "✅ server.js deployed"

pm2 restart adms-sync
echo "✅ adms-sync restarted via PM2"

sleep 2
pm2 status adms-sync
`;

const conn = new Client();

conn.on('ready', () => {
  console.log('🔗 Connected to VPS');
  conn.exec(script, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    stream.on('close', (code) => {
      console.log(`\nDone. Exit code: ${code}`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH error:', err.message);
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026',
  readyTimeout: 15000,
});
