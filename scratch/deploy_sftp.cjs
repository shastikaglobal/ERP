const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

const packingServicePath = 'd:/ERP/ERP/src/lib/packing-service.ts';
const warehouseRoutePath = 'd:/ERP/ERP/adms-sync/routes/warehouse.js';
const packingsListPath = 'd:/ERP/ERP/src/components/warehouse/PackingsList.tsx';

conn.on('ready', () => {
  console.log('SSH Client :: ready');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    console.log('SFTP subsystem ready.');
    
    // 1. Upload backend route
    console.log('Uploading backend warehouse route...');
    sftp.fastPut(warehouseRoutePath, '/var/www/adms-sync/routes/warehouse.js', (err) => {
      if (err) throw err;
      console.log('Backend warehouse route uploaded successfully.');
      
      // 2. Upload frontend service
      console.log('Uploading frontend packing service...');
      sftp.fastPut(packingServicePath, '/var/www/erp/src/lib/packing-service.ts', (err) => {
        if (err) throw err;
        console.log('Frontend packing service uploaded successfully.');
        
        // 3. Upload PackingsList component
        console.log('Uploading PackingsList component...');
        sftp.fastPut(packingsListPath, '/var/www/erp/src/components/warehouse/PackingsList.tsx', (err) => {
          if (err) throw err;
          console.log('PackingsList component uploaded successfully.');
          
          // Close SFTP session
          sftp.end();
          
          // 4. Restart PM2 and build frontend
          console.log('Executing pm2 restart and frontend build...');
          const script = 'pm2 restart adms-sync && cd /var/www/erp && npm run build';
          conn.exec(script, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code) => {
              console.log(`VPS commands finished with exit code ${code}`);
              conn.end();
            }).on('data', (data) => {
              process.stdout.write(data);
            }).stderr.on('data', (data) => {
              process.stderr.write(data);
            });
          });
        });
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
