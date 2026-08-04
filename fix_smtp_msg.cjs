const fs = require('fs');
let c = fs.readFileSync('adms-sync/server.js', 'utf8');

c = c.replace(/message: 'Email failed to send\. Returning reset link directly\.'/g, "message: 'Your password reset request has been sent to the system administrator. Please wait for the administrator to provide your temporary password.'");

fs.writeFileSync('adms-sync/server.js', c);
