const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`sudo -u postgres psql -d erp -c "UPDATE attendance_logs SET clock_in = clock_in + interval '5 hours 30 minutes', clock_out = clock_out + interval '5 hours 30 minutes' WHERE date = '2026-06-12' AND is_manual = false; UPDATE \\"AttLogs\\" SET \\"LogDateTime\\" = \\"LogDateTime\\" + interval '5 hours 30 minutes' WHERE \\"LogDateTime\\" >= '2026-06-11' AND \\"DeviceId\\" = 'NFZ8250603096';"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', (d) => console.log(d.toString()));
  });
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026'
});
