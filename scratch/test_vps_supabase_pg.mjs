import { Client } from 'ssh2';

const conn = new Client();

const scriptToRun = `
const pg = require('pg');

async function testHost(host, port, user) {
  console.log(\`Testing connection to \${host}:\${port} with user \${user}...\`);
  const client = new pg.Client({
    host,
    port,
    user,
    database: 'postgres',
    password: 'Shastika2026',
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log(\`✅ SUCCESS: Connected to \${host}:\${port} with user \${user}!\`);
    await client.end();
    return true;
  } catch (err) {
    console.error(\`❌ FAILED: \${err.message}\`);
    return false;
  }
}

async function runAll() {
  const projectRef = 'sxebygxpjzntogzpjnga';
  
  // Test combinations
  const configs = [
    { host: \`db.\${projectRef}.supabase.co\`, port: 5432, user: 'postgres' },
    { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 5432, user: \`postgres.\${projectRef}\` },
    { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 6543, user: \`postgres.\${projectRef}\` },
    { host: 'aws-0-us-east-1.pooler.supabase.com', port: 5432, user: \`postgres.\${projectRef}\` },
    { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: \`postgres.\${projectRef}\` },
  ];
  
  for (const c of configs) {
    const ok = await testHost(c.host, c.port, c.user);
    if (ok) {
      console.log('--- FOUND WORKING CONFIG ---');
      console.log(JSON.stringify(c, null, 2));
      break;
    }
  }
}
runAll();
`;

conn.on('ready', () => {
  console.log('📡 SSH Connected');
  conn.exec(`cat << 'EOF' > /var/www/adms-sync/test_supa_conn.js\n${scriptToRun}\nEOF\ncd /var/www/adms-sync && node test_supa_conn.js`, (err, stream) => {
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
