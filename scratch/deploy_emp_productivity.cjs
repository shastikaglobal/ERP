const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

// Read the updated analytics.js
const analyticsContent = fs.readFileSync(
  path.join(__dirname, '..', 'adms-sync', 'routes', 'analytics.js'),
  'utf8'
);

conn.on('ready', () => {
  console.log('SSH Connected');

  // Step 1: Upload analytics.js via sftp
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const remotePath = '/var/www/adms-sync/routes/analytics.js';
    const writeStream = sftp.createWriteStream(remotePath);

    writeStream.on('close', () => {
      console.log('✅ analytics.js uploaded to VPS');

      // Step 2: restart adms-sync, then git pull + build frontend
      const script = `
pm2 restart adms-sync
echo "--- backend restarted ---"
cd /var/www/erp
git pull origin main
echo "--- git pulled ---"
npm run build
echo "--- build done ---"
pm2 restart erp-frontend || pm2 start ecosystem.config.js --only erp-frontend
pm2 status
echo "--- done ---"
`;
      conn.exec(script, (err2, stream) => {
        if (err2) throw err2;
        stream
          .on('close', (code) => {
            console.log('Deployment complete, exit code:', code);
            conn.end();
          })
          .on('data', (data) => process.stdout.write(data))
          .stderr.on('data', (data) => process.stderr.write(data));
      });
    });

    writeStream.on('error', (e) => { console.error('SFTP write error:', e); conn.end(); });
    writeStream.write(analyticsContent);
    writeStream.end();
  });

}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026',
  algorithms: {
    serverHostKey: ['ssh-ed25519', 'ssh-rsa', 'ecdsa-sha2-nistp256']
  }
});
