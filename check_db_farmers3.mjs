import { Client } from 'ssh2';

const conn = new Client();

const scriptContent = `
require('dotenv').config();
const db = require('./db');

async function run() {
  try {
    const res = await db.query('SELECT * FROM farmers ORDER BY created_at DESC LIMIT 5');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
`;

conn.on('ready', () => {
  conn.exec(`cat << 'EOF' > /var/www/adms-sync/check_farmers3.cjs
${scriptContent}
EOF
cd /var/www/adms-sync && node check_farmers3.cjs`, (err, stream) => {
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
