const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'routes');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
let modifiedCount = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('supabase') || content.includes('legacyDb')) {
    const lines = content.split('\n');
    const newLines = lines.map(line => {
      if ((line.includes('supabase') || line.includes('legacyDb')) && !line.includes('//')) {
        return '// ' + line;
      }
      return line;
    });
    fs.writeFileSync(filePath, newLines.join('\n'));
    modifiedCount++;
  }
}
console.log('Modified ' + modifiedCount + ' files to comment out supabase/legacyDb.');
