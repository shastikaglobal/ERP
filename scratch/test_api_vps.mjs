import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connection ready.');
  // Curl the localhost:8082/api/analytics/sidebar_counts endpoint directly on the VPS
  // Note: we need to pass a mock Bearer token if it uses requireAuth, but wait, requireAuth requires a valid Supabase token.
  // We can query the database directly inside node running on the VPS, or run a small node snippet on the VPS to print the output of the query from within the app context!
  // Let's run a node script on the VPS that imports db and queries the counts just like server.js does!
  const nodeSnippet = `
    const db = require('/var/www/adms-sync/db');
    async function test() {
      try {
        const acq = await db.query("SELECT COUNT(*) as count FROM client_acquisition ca WHERE ca.is_deleted IS NOT TRUE");
        const conv = await db.query("SELECT COUNT(*) as count FROM leads WHERE is_deleted IS NOT TRUE AND stage IN ('Won', 'Client Successfully Acquired')");
        const cust = await db.query("SELECT COUNT(*) as count FROM customers WHERE is_deleted IS NOT TRUE");
        console.log(JSON.stringify({
          clientAcq: acq.rows[0].count,
          conversions: conv.rows[0].count,
          customers: cust.rows[0].count
        }));
      } catch(e) {
        console.error(e.message);
      } finally {
        process.exit(0);
      }
    }
    test();
  `;
  conn.exec(`node -e ${JSON.stringify(nodeSnippet)}`, (err, stream) => {
    if (err) throw err;
    let stdout = '';
    let stderr = '';
    stream.on('close', (code) => {
      console.log('--- VPS DB DIRECT QUERY RESULT ---');
      console.log(stdout);
      if (stderr) console.error('STDERR:', stderr);
      conn.end();
    }).on('data', (data) => {
      stdout += data.toString();
    }).stderr.on('data', (data) => {
      stderr += data.toString();
    });
  });
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026'
});
