const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('pm2 delete erp-frontend', (err, stream) => {
    if (err) throw err;
    let out = "";
    stream.on('close', (code, signal) => {
      console.log('PM2 command closed.');
      conn.exec('pm2 save', (err2, stream2) => {
        if (err2) throw err2;
        stream2.on('close', () => {
          console.log('PM2 state saved.');
          conn.end();
        });
      });
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.error(data.toString());
    });
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
