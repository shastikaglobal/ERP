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
  try {
    // 1. Fetch profiles from VPS DB
    const { rows: vpsProfiles } = await pool.query("SELECT id, email, full_name FROM profiles");
    const vpsIds = new Set(vpsProfiles.map(p => p.id));
    console.log(`VPS profiles count: ${vpsProfiles.length}`);

    // 2. Fetch profiles from Supabase
    const { data: supaProfiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name');
    
    if (error) throw error;
    console.log(`Supabase profiles count: ${supaProfiles.length}`);

    // 3. Find profiles in Supabase but not in VPS DB
    const orphanedSupaProfiles = supaProfiles.filter(p => !vpsIds.has(p.id));
    console.log(`\nFound ${orphanedSupaProfiles.length} profiles in Supabase that do not exist in VPS:`);
    orphanedSupaProfiles.forEach(p => console.log(`  - ${p.full_name} (${p.email}) [id: ${p.id}]`));

    // 4. Delete orphaned profiles in Supabase
    if (orphanedSupaProfiles.length > 0) {
      console.log('\n🧹 Deleting orphaned profiles from Supabase...');
      for (const p of orphanedSupaProfiles) {
        // Also delete from user_roles in Supabase first
        await supabase.from('user_roles').delete().eq('user_id', p.id);
        
        // Delete from profiles
        const { error: delErr } = await supabase.from('profiles').delete().eq('id', p.id);
        if (delErr) {
          console.error(`  ❌ Failed to delete ${p.email}:`, delErr.message);
        } else {
          console.log(`  ✅ Deleted: ${p.email}`);
        }
      }
    }

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
