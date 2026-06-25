import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('📡 SSH Connection Ready');
  conn.exec('cat /etc/nginx/sites-available/default', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log(`Stream closed with code: ${code}`);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT:\n' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR:\n' + data);
    });
  });
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026'
});
