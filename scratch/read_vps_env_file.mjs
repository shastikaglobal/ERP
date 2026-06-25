import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connection ready. Finding env file...');
  // Find where PM2 runs from or find the process info
  conn.exec('pm2 env adms-sync | grep -A 20 -B 5 "db" || pm2 show adms-sync; echo "--- ACTUAL FILES ---"; ls -la /root/nethramerge; cat /root/nethramerge/adms-sync/.env || cat /root/nethramerge/.env', (err, stream) => {
    if (err) throw err;
    let stdout = '';
    let stderr = '';
    stream.on('close', (code) => {
      console.log('--- VPS PM2 ENV & FILES ---');
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
