const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

if (!code.includes("app.set('trust proxy', 1)")) {
  // Find where rate limit is defined or added
  const insertIndex = code.indexOf('const limiter = rateLimit({');
  if (insertIndex !== -1) {
    const before = code.slice(0, insertIndex);
    const after = code.slice(insertIndex);
    code = before + "app.set('trust proxy', 1);\n" + after;
    fs.writeFileSync('server.js', code);
    console.log('Added trust proxy 1 to server.js');
  } else {
    // maybe app.use(rateLimit...) ?
    const expressAppIdx = code.indexOf('const app = express();');
    if (expressAppIdx !== -1) {
      code = code.replace('const app = express();', "const app = express();\napp.set('trust proxy', 1);");
      fs.writeFileSync('server.js', code);
      console.log('Added trust proxy 1 after app init');
    }
  }
} else {
  console.log('trust proxy already set');
}
