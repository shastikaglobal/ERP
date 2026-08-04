const fs = require('fs');
let c = fs.readFileSync('adms-sync/server.js', 'utf8');
c = c.replace('const app = express();', 'console.log("SERVER PG_PASSWORD:", process.env.PG_PASSWORD); const app = express();');
fs.writeFileSync('adms-sync/server.js', c);
