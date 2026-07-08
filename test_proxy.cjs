const fetch = require('node-fetch');
fetch('http://localhost:8080/api/farmers', { method: 'POST', body: '{}', headers: {'Content-Type': 'application/json'} })
  .then(res => res.text().then(text => console.log('Status:', res.status, text)))
  .catch(err => console.error('Error:', err.message));
