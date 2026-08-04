const fs = require('fs');
const lines = fs.readFileSync('adms-sync/server.js', 'utf8').split('\n');
const matched = lines.filter((l, i) => l.includes('login')).map((l, i) => 'Line ' + i + ': ' + l.trim());
fs.writeFileSync('match.txt', matched.join('\n'));
