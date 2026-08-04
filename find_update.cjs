const fs = require('fs');
const lines = fs.readFileSync('adms-sync/server.js', 'utf8').split('\n');
lines.forEach((l, i) => { 
  if (l.includes("app.post('/api/auth/update-password'")) console.log('Line ' + (i+1)); 
})
