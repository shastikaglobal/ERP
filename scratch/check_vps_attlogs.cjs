const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`sudo -u postgres psql -d erp -c "SELECT \\"LogDateTime\\", \\"DeviceId\\" FROM \\"AttLogs\\" ORDER BY \\"LogDateTime\\" DESC LIMIT 5;"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', (d) => console.log(d.toString()));
  });
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026'
});
