import { Client } from 'ssh2';

const conn = new Client();

const scriptToRun = `
const pg = require('pg');
const client = new pg.Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'shastika_erp',
  password: 'Shastika2026',
  port: 5432,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to local VPS DB');
    
    const res = await client.query(
      "SELECT id, to_address, subject, status, created_at FROM emails ORDER BY created_at DESC LIMIT 10"
    );
    
    console.log('--- Recent Emails ---');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
run();
`;

conn.on('ready', () => {
  console.log('📡 SSH Connection Ready');
  conn.exec(`cat << 'EOF' > /var/www/adms-sync/check_emails.js\n${scriptToRun}\nEOF\ncd /var/www/adms-sync && node check_emails.js`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.error(data.toString());
    });
  });
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026'
});
