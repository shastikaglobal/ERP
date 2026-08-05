import { Client } from 'ssh2';

const conn = new Client();

const envAppends = `
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="shastikaglobal11@gmail.com"
SMTP_PASS="tobvksrcelpeastj"
`;

conn.on('ready', () => {
  conn.exec(`echo '${envAppends}' >> /root/updated-ERP/adms-sync/.env && pm2 restart all`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026'
});
