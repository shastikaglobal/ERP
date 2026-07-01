const { Client } = require('pg');

const client = new Client({
  host: '195.35.22.13',
  port: 5432,
  user: 'erp_admin',
  password: 'Shastika2026',
  database: 'shastika_erp',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to VPS PG database.');

  console.log('\n--- Profiles for Ramragul, Karunya, and shastikaglobal11 ---');
  const profilesRes = await client.query(`
    SELECT id, email, full_name, role, status, is_active, is_deleted 
    FROM profiles 
    WHERE email ILIKE '%ramragul%' OR email ILIKE '%karunya%' OR email ILIKE '%shastikaglobal11%'
  `);
  console.log(JSON.stringify(profilesRes.rows, null, 2));

  console.log('\n--- User Roles ---');
  const rolesRes = await client.query(`
    SELECT ur.user_id, ur.role_id, r.slug, r.name, p.email, p.full_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    LEFT JOIN profiles p ON ur.user_id = p.id
    WHERE p.email ILIKE '%ramragul%' OR p.email ILIKE '%karunya%' OR p.email ILIKE '%shastikaglobal11%'
  `);
  console.log(JSON.stringify(rolesRes.rows, null, 2));

  await client.end();
}

main().catch(console.error);
