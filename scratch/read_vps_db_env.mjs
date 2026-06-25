import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('📡 SSH Connected');
  conn.exec(`cat /var/www/adms-sync/.env`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('--- VPS .env ---');
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
