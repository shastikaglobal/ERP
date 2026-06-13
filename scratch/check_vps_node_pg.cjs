const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`node -e "const { Client } = require('pg'); const c = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/erp' }); c.connect().then(() => c.query('SELECT * FROM attendance_logs WHERE date = \\'2026-06-12\\'')).then(r => console.log(r.rows)).catch(console.error).finally(() => c.end());"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', (d) => console.log(d.toString())).stderr.on('data', d => console.log(d.toString()));
  });
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026'
});
