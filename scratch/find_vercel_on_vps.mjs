import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connection ready.');
  // Find vercel files or search for vercel token in all env files on the VPS
  conn.exec('find /var/www -name "*vercel*" -o -name ".vercel" 2>/dev/null; echo "--- HOME FILES ---"; find /root -name ".vercel" -o -name "*vercel*" 2>/dev/null', (err, stream) => {
    if (err) throw err;
    let stdout = '';
    let stderr = '';
    stream.on('close', (code) => {
      console.log('--- RESULT ---');
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
