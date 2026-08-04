const fs = require('fs');
let c = fs.readFileSync('adms-sync/server.js', 'utf8');

c = c.replace(/maxAge:\s*7\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/g, '');
c = c.replace(/maxAge:\s*30\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/g, '');
c = c.replace(/maxAge:\s*60\s*\*\s*60\s*\*\s*1000/g, '');
c = c.replace(/,\s*\/\/.*?days/g, '');
c = c.replace(/,\s*\n\s*}/g, '\n      }');
c = c.replace(/path:\s*'\/'\s*,/g, "path: '/'");

fs.writeFileSync('adms-sync/server.js', c);
