const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec("sed -i 's/^PORT=8082/PORT=8081/g' /root/ERP/adms-sync/.env && grep PORT /root/ERP/adms-sync/.env || echo 'PORT=8081' >> /root/ERP/adms-sync/.env && pm2 restart adms-sync", (err, stream) => {
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
