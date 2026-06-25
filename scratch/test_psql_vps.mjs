import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connection ready.');
  conn.exec('PGPASSWORD=Shastika2026 psql -h 127.0.0.1 -U postgres -d shastika_erp -c "SELECT COUNT(*), is_deleted FROM client_acquisition GROUP BY is_deleted; SELECT COUNT(*), is_deleted FROM customers GROUP BY is_deleted;"', (err, stream) => {
    if (err) throw err;
    let stdout = '';
    let stderr = '';
    stream.on('close', (code) => {
      console.log('--- VPS PSQL RESULT ---');
      console.log(stdout);
      if (stderr) console.error('STDERR:', stderr);
      conn.end();
    }).on('data', (data) => {
      stdout += data.toString();
    }).stderr.on('data', (data) => {
      stderr += data.toString();
    });
  });
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026'
});
