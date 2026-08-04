const fs = require('fs');
const lines = fs.readFileSync('src/pages/Auth.tsx', 'utf8').split('\n');
lines.forEach((l, i) => { 
  if (l.includes("fetch(")) console.log('Line ' + (i+1) + ': ' + l.trim()); 
})
