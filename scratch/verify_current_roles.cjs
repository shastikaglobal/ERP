const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || '195.35.22.13',
  user: 'erp_admin',
  password: process.env.PG_PASSWORD || 'Shastika2026',
  database: 'shastika_erp',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxebygxpjzntogzpjnga.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const userId = '8dbeed44-5fa8-4e55-8508-e60f4b219dc3';
  try {
    // 1. VPS DB Check
    const { rows: vpsRoles } = await pool.query(
      `SELECT ur.user_id, ur.role_id, r.slug 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    console.log("--- VPS DB user_roles for ShastikaGlobalImpexPrivateLimited ---");
    console.log(vpsRoles);

    // 2. Supabase Check
    const { data: supaRoles, error } = await supabase
      .from('user_roles')
      .select('user_id, role_id, roles(slug)')
      .eq('user_id', userId);
    
    if (error) throw error;
    console.log("\n--- Supabase user_roles for ShastikaGlobalImpexPrivateLimited ---");
    console.log(supaRoles.map(r => ({ user_id: r.user_id, role_id: r.role_id, slug: r.roles?.slug })));

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
