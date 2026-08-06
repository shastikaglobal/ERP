const jwt = require('jsonwebtoken');
const http = require('http');
const db = require('./db');

async function runTest() {
  try {
    const token = jwt.sign(
      { sub: '4722ecc8-ec1f-4afb-acf8-444d3bdba677', role: 'admin' }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '1h' }
    );
    
    const postData = JSON.stringify({
      id: 'v-' + Date.now(),
      farmer_id: 'b13bf33f-4f48-441f-9847-228bde6dc0d2',
      date: new Date().toISOString(),
      status: 'Scheduled',
      purpose: 'Verification Visit',
      notes: 'Testing end-to-end from node updated'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 8082,
      path: '/api/farmers/visits',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer ' + token
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', async () => {
        console.log('--- POST RESPONSE ---');
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
        
        try {
          const { rows } = await db.query('SELECT * FROM farm_visits WHERE notes = $1', ['Testing end-to-end from node updated']);
          console.log('--- POSTGRES DB ---');
          console.log('Found rows:', rows.length);
        } catch(err) {
          console.log('DB Error:', err.message);
        }
        
        http.get({
          hostname: 'localhost',
          port: 8082,
          path: '/api/farmers/visits',
          headers: { 'Authorization': 'Bearer ' + token }
        }, (getRes) => {
          let getData = '';
          getRes.on('data', d => getData += d);
          getRes.on('end', () => {
            console.log('--- GET RESPONSE ---');
            console.log('Status:', getRes.statusCode);
            console.log('Found in GET list:', getData.includes('Testing end-to-end from node updated'));
            process.exit(0);
          });
        });
      });
    });
    
    req.write(postData);
    req.end();
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
require('dotenv').config();
runTest();
