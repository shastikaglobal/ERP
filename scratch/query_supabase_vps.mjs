import { Client } from 'ssh2';

const conn = new Client();

const scriptToRun = `
const pg = require('pg');
const client = new pg.Client({
  host: 'db.sxebygxpjzntogzpjnga.supabase.co',
  port: 5432,
  user: 'postgres',
  database: 'postgres',
  password: 'Shastika2026',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase DB from VPS');
    
    const email = 'shastikaglobal11@gmail.com';
    
    // 1. Get user details
    const userRes = await client.query("SELECT id, email, encrypted_password, email_confirmed_at, phone FROM auth.users WHERE email = $1", [email]);
    console.log('--- User Row ---');
    console.log(JSON.stringify(userRes.rows, null, 2));
    
    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].id;
      // 2. Get identities
      const idRes = await client.query("SELECT id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at FROM auth.identities WHERE user_id = $1", [userId]);
      console.log('--- Identities ---');
      console.log(JSON.stringify(idRes.rows, null, 2));
    }
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
  // Write the script to a temp file on the VPS and run it
  conn.exec(`cat << 'EOF' > /var/www/adms-sync/check_supa_ids.js\n${scriptToRun}\nEOF\ncd /var/www/adms-sync && node check_supa_ids.js`, (err, stream) => {
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
