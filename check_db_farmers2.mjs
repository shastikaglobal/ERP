import { Client } from 'ssh2';

const conn = new Client();

const scriptContent = `
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:SHASTIKARAM%402026@localhost:5432/erp_db'
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM farmers ORDER BY created_at DESC LIMIT 5');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
`;

conn.on('ready', () => {
  conn.exec(`cat << 'EOF' > /var/www/adms-sync/check_farmers.cjs
${scriptContent}
EOF
cd /var/www/adms-sync && node check_farmers.cjs`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026'
});
