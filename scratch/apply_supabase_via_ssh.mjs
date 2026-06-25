import { Client } from 'ssh2';

const conn = new Client();

const sql = `
CREATE TABLE IF NOT EXISTS public.warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated manage" ON public.warehouse_stock;
CREATE POLICY "Allow authenticated manage" ON public.warehouse_stock 
  FOR ALL USING (auth.role() = 'authenticated');
`;

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
    console.log('📡 Connected to Supabase DB from VPS.');

    console.log('Running DDL queries...');
    await client.query(\`${sql}\`);
    console.log('✅ DDL executed successfully.');

    // Verification
    const tableCheck = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'warehouse_stock';");
    console.log('Tables found:', tableCheck.rows.map(r => r.table_name));

    const policyCheck = await client.query("SELECT policyname FROM pg_policies WHERE tablename = 'warehouse_stock';");
    console.log('Policies on warehouse_stock:', policyCheck.rows.map(r => r.policyname));
    
  } catch (err) {
    console.error('❌ SQL execution failed:', err.message);
  } finally {
    await client.end();
  }
}
run();
`;

conn.on('ready', () => {
  console.log('📡 SSH Connection to VPS established.');
  conn.exec(`cat << 'EOF' > /var/www/adms-sync/migrate_supa.js\n${scriptToRun}\nEOF\ncd /var/www/adms-sync && node migrate_supa.js`, (err, stream) => {
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
