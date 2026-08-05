const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

// 1. Process exception handlers at the top
if (!code.includes("process.on('uncaughtException'")) {
  code = `
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

` + code;
}

// 2. Trust proxy before middleware
code = code.replace(/app\.set\('trust proxy', 1\);\n?/g, '');
code = code.replace('const app = express();', "const app = express();\napp.set('trust proxy', 1);");

// 3. Health check endpoint
if (!code.includes("app.get('/api/health'")) {
  code = code.replace("app.set('trust proxy', 1);", "app.set('trust proxy', 1);\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok', timestamp: new Date() });\n});\n");
}

// 4. Global Express error handler at the bottom
if (!code.includes("app.use((err, req, res, next)")) {
  if (code.includes('app.listen(')) {
    code = code.replace('app.listen(', `app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});\n\napp.listen(`);
  }
}

fs.writeFileSync('server.js', code, 'utf8');
console.log('server.js updated successfully');
