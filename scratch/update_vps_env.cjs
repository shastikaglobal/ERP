const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec("sed -i 's/^DEVICE_TIMEZONE_OFFSET=.*/DEVICE_TIMEZONE_OFFSET=+00:00/g' /var/www/adms-sync/.env && pm2 restart adms-sync", (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', (d) => console.log('STDOUT:', d.toString())).stderr.on('data', d => console.log('STDERR:', d.toString()));
  });
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026'
});
