const fs = require('fs');
let c = fs.readFileSync('adms-sync/server.js', 'utf8');

c = c.replace(/refreshToken, \{\s*httpOnly: true,\s*secure: process\.env\.NODE_ENV === 'production',\s*sameSite: process\.env\.NODE_ENV === 'production' \? 'none' : 'lax',\s*path: '\/',/g, '');

fs.writeFileSync('adms-sync/server.js', c);
