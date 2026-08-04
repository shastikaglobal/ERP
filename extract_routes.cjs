const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const routes = [];
const regex = /<Route[^>]*path=["']([^"']+)["'][^>]*>/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const path = match[1];
  if (!path.includes('*') && !path.includes(':')) {
    routes.push(path);
  }
}
fs.writeFileSync('routes.json', JSON.stringify(routes, null, 2));
