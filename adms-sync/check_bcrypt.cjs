const fs = require('fs');
console.log(fs.readFileSync('server.js', 'utf8').match(/require\(['"]bcrypt.*?['"]\)/g));
