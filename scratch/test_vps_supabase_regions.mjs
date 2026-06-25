import { Client } from 'ssh2';

const conn = new Client();

const scriptToRun = `
const pg = require('pg');

async function testConfig(region) {
  const host = \`aws-0-\${region}.pooler.supabase.com\`;
  const port = 6543; // transaction pooler port
  const user = 'postgres.sxebygxpjzntogzpjnga';
  const password = 'Shastika2026';
  
  const client = new pg.Client({
    host,
    port,
    user,
    database: 'postgres',
    password,
    connectionTimeoutMillis: 3000,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log(\`✅ SUCCESS: Connected to \${region} (\${host})!\`);
    await client.end();
    return true;
  } catch (err) {
    if (err.message.includes('tenant/user') && err.message.includes('not found')) {
      // The host exists but the tenant is not in this region
      return false;
    }
    if (err.message.includes('password authentication failed')) {
      console.log(\`🔑 REGION FOUND: \${region} (Host exists, but password incorrect)\`);
      return true;
    }
    // Other errors (timeout, ENOTFOUND) mean the region host might not exist or be unreachable
    return false;
  }
}

async function runAll() {
  const regions = [
    'ap-south-1',       // Mumbai
    'ap-southeast-1',   // Singapore
    'ap-southeast-2',   // Sydney
    'ap-northeast-1',   // Tokyo
    'ap-northeast-2',   // Seoul
    'us-east-1',        // N. Virginia
    'us-east-2',        // Ohio
    'us-west-1',        // N. California
    'us-west-2',        // Oregon
    'eu-west-1',        // Ireland
    'eu-west-2',        // London
    'eu-west-3',        // Paris
    'eu-central-1',     // Frankfurt
    'ca-central-1',     // Canada
    'sa-east-1'         // São Paulo
  ];
  
  console.log('Starting region sweep...');
  for (const r of regions) {
    const found = await testConfig(r);
    if (found) {
      console.log(\`sweep complete. Match: \${r}\`);
      break;
    }
  }
  console.log('Sweep finished.');
}
runAll();
`;

conn.on('ready', () => {
  console.log('📡 SSH Connected for region sweep');
  conn.exec(`cat << 'EOF' > /var/www/adms-sync/sweep_regions.js\n${scriptToRun}\nEOF\ncd /var/www/adms-sync && node sweep_regions.js`, (err, stream) => {
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
