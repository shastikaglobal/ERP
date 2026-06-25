import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connection ready.');
  conn.exec('ls -la /var/www/shastika-erp; ls -la /var/www/shastika-erp/.vercel; ls -la /root/.vercel; cat /root/.vercel/auth.json', (err, stream) => {
    if (err) throw err;
    let stdout = '';
    let stderr = '';
    stream.on('close', (code) => {
      console.log('--- VPS DIRECTORIES ---');
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
