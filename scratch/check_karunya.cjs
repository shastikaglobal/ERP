require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });
client.connect().then(() => 
  client.query("SELECT p.full_name, a.clock_in, a.clock_out, a.is_manual FROM attendance_logs a JOIN profiles p ON a.employee_id = p.id WHERE p.full_name ILIKE '%karunya%' AND a.date = '2026-06-12'")
).then(res => {
  console.log(res.rows);
  client.end();
}).catch(console.error);
