const fs = require('fs');
const lines = fs.readFileSync('adms-sync/server.js', 'utf8').split('\n');
lines.forEach((l, i) => { 
  if (l.includes('/api/auth')) console.log('Line ' + (i+1) + ': ' + l.trim()); 
})
