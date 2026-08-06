const fs = require('fs');
console.log(fs.readFileSync('build.log', 'utf8').replace(/\0/g, ''));
