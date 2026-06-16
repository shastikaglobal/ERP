const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

const packingServiceCode = fs.readFileSync('d:/ERP/ERP/src/lib/packing-service.ts', 'utf8');
const backendWarehouseRouteCode = fs.readFileSync('d:/ERP/ERP/adms-sync/routes/warehouse.js', 'utf8');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  // 1. Upload backend route
  conn.exec('cat > /var/www/adms-sync/routes/warehouse.js', (err, stream) => {
    if (err) throw err;
    stream.write(backendWarehouseRouteCode);
    stream.end();
    
    stream.on('close', () => {
      console.log('Backend route uploaded.');
      
      // 2. Restart PM2 and upload frontend service
      conn.exec('pm2 restart adms-sync && cat > /var/www/erp/src/lib/packing-service.ts', (err, stream2) => {
        if (err) throw err;
        stream2.write(packingServiceCode);
        stream2.end();
        
        stream2.on('close', () => {
          console.log('Frontend service uploaded.');
          
          // 3. Build frontend
          conn.exec('cd /var/www/erp && npm run build', (err, stream3) => {
            if (err) throw err;
            stream3.on('close', (code) => {
              console.log('Frontend build finished with code:', code);
              conn.end();
            }).on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
          });
        }).on('data', (d) => process.stdout.write(d))
          .stderr.on('data', (d) => process.stderr.write(d));
      });
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
