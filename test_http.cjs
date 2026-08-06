const fs = require('fs');
const http = require('http');

http.get('http://localhost:8082/api/farmers/b13bf33f-4f48-441f-9847-228bde6dc0d2', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${data}`);
  });
}).on('error', (err) => {
  console.error(err);
});
