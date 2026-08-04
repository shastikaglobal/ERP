const fs = require('fs');

let c = fs.readFileSync('adms-sync/server.js', 'utf8');

const t = `const nodemailer = require('nodemailer');`;
c = c.replace(t, '');

fs.writeFileSync('adms-sync/server.js', c);
