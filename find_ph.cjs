const fs = require('fs');
const lines = fs.readFileSync('adms-sync/server.js', 'utf8').split('\n');
lines.forEach((l, i) => { 
  if (l.includes("passwordHash")) console.log('Line ' + (i+1) + ': ' + l); 
})
