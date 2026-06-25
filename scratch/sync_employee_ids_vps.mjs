import { Client } from 'ssh2';

const conn = new Client();

const scriptToRun = `
const pg = require('pg');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const ws = require('ws');
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    realtime: { transport: ws }
  }
);

const pgClient = new pg.Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'shastika_erp',
  password: 'Shastika2026',
  port: 5432,
});

async function run() {
  try {
    await pgClient.connect();
    console.log('Connected to local VPS database.');

    // 1. Fetch all profiles from Supabase
    console.log('Fetching profiles from Supabase...');
    const { data: sbProfiles, error: sbError } = await supabase
      .from('profiles')
      .select('id, full_name, email, biometric_id, employee_id');

    if (sbError) throw sbError;

    console.log('Aligning employee_id with biometric_id on Supabase...');
    for (const profile of sbProfiles) {
      if (profile.biometric_id && profile.biometric_id.trim() !== '') {
        const targetEmployeeId = profile.biometric_id.trim();
        if (profile.employee_id !== targetEmployeeId) {
          console.log(\`Updating Supabase profile \${profile.full_name || profile.email} (\${profile.id}): employee_id = \${targetEmployeeId}\`);
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ employee_id: targetEmployeeId })
            .eq('id', profile.id);
            
          if (updateError) {
            console.error(\`Failed to update \${profile.id} on Supabase:\`, updateError.message);
          }
        }
      }
    }

    // 2. Update local VPS PostgreSQL database profiles table
    console.log('Updating local VPS PostgreSQL database...');
    const pgRes = await pgClient.query(\`
      UPDATE profiles 
      SET employee_id = biometric_id 
      WHERE biometric_id IS NOT NULL 
        AND biometric_id <> ''
        AND (employee_id IS NULL OR employee_id <> biometric_id)
      RETURNING id, full_name, email, employee_id, biometric_id
    \`);

    console.log(\`Updated \${pgRes.rowCount} profiles in local VPS database:\`);
    pgRes.rows.forEach(r => {
      console.log(\`- \${r.full_name || r.email}: employee_id = \${r.employee_id}, biometric_id = \${r.biometric_id}\`);
    });

    console.log('🎉 Employee ID and Punching ID alignment completed successfully!');
  } catch (err) {
    console.error('❌ Error during alignment:', err.message);
  } finally {
    await pgClient.end();
  }
}
run();
`;

conn.on('ready', () => {
  console.log('📡 SSH Connection Ready');
  conn.exec(`cat << 'EOF' > /var/www/adms-sync/sync_employee_ids.js\n${scriptToRun}\nEOF\ncd /var/www/adms-sync && node sync_employee_ids.js`, (err, stream) => {
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
