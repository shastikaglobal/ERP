const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:admin@localhost:5432/erp' });
client.connect().then(() => 
  client.query(`UPDATE attendance_logs SET clock_in = clock_in + interval '5 hours 30 minutes', clock_out = clock_out + interval '5 hours 30 minutes' WHERE date = '2026-06-12' AND is_manual = false RETURNING clock_in;`)
).then(res => {
  console.log("Updated rows in attendance_logs:", res.rows.length);
  return client.query(`UPDATE "AttLogs" SET "LogDateTime" = "LogDateTime" + interval '5 hours 30 minutes' WHERE "LogDateTime" >= '2026-06-11' AND "DeviceId" = 'NFZ8250603096' RETURNING "LogDateTime";`);
}).then(res => {
  console.log("Updated rows in AttLogs:", res.rows.length);
  client.end();
}).catch(console.error);
