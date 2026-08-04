const fs = require('fs');
let c = fs.readFileSync('adms-sync/server.js', 'utf8');

c = c.replace(/path:\s*'\/'\s*\(increased from 1 hr for easier testing\)/g, "path: '/'");

fs.writeFileSync('adms-sync/server.js', c);
