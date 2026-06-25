import pg from 'pg';
const { Client } = pg;

async function testConnection() {
  const projectRef = 'sxebygxpjzntogzpjnga';
  const password = 'Shastika2026';
  
  // Try direct connection host
  const hostDirect = `db.${projectRef}.supabase.co`;
  // Try pooler connection host
  const hostPooler = `aws-0-us-east-1.pooler.supabase.com`;
  
  const hosts = [hostDirect, hostPooler];
  
  for (const host of hosts) {
    console.log(`Connecting to ${host}...`);
    const client = new Client({
      connectionString: `postgresql://postgres.${projectRef}:${password}@${host}:5432/postgres`,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await client.connect();
      console.log(`✅ Success! Connected to Supabase DB via host: ${host}`);
      
      const res = await client.query('SELECT version();');
      console.log("Database version:", res.rows[0].version);
      
      await client.end();
      return;
    } catch (err) {
      console.error(`❌ Failed to connect to ${host}:`, err.message);
    }
  }
}

testConnection();
