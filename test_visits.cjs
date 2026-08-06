const http = require('http');

const postData = JSON.stringify({
  id: 'v-12345678', // This is what the frontend was sending, which was breaking it
  farmer_id: 'b13bf33f-4f48-441f-9847-228bde6dc0d2', // Valid UUID of a farmer
  date: new Date().toISOString(),
  status: 'Scheduled',
  purpose: 'Quality Check',
  notes: 'Testing insertion script'
});

const req = http.request({
  hostname: '195.35.22.13',
  port: 8082,
  path: '/api/farmers/visits',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer test-token-bypass'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`POST Status: ${res.statusCode}`);
    console.log(`POST Body: ${data}`);
    
    // Now test GET
    http.get('http://195.35.22.13:8082/api/farmers/visits', {
      headers: { 'Authorization': 'Bearer test-token-bypass' }
    }, (resGet) => {
      let getData = '';
      resGet.on('data', (chunk) => { getData += chunk; });
      resGet.on('end', () => {
        console.log(`GET Status: ${resGet.statusCode}`);
        console.log(`GET Body: ${getData}`);
      });
    });
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
