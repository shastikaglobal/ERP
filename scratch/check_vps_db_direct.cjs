const { Client } = require('ssh2');
const conn = new Client();
const script = `cd /var/www/adms-sync && node -e "const db = require('./db.js'); db.query('SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = \\'is_deleted\\'', ['packing_protocols']).then(r => { console.log('VPS LOCAL QUERY RESULT:', r.rows); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })"`;
conn.on('ready', () => {
  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d)).on('close', () => conn.end());
  });
}).connect({ host: '195.35.22.13', port: 22, username: 'root', password: 'SHASTIKARAM@2026' });
