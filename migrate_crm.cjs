const fs = require('fs');
const path = require('path');

const crmDir = path.join(__dirname, 'src', 'pages', 'crm');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove supabase import
  content = content.replace(/import\s*\{\s*supabase\s*\}\s*from\s*['"]@\/integrations\/supabase\/client['"];?\n?/g, '');

  // 2. Remove session retrieval
  content = content.replace(/const\s*\{\s*data\s*:\s*\{\s*session\s*\}\s*\}\s*=\s*await\s*supabase\.auth\.getSession\(\);\n?/g, '');
  content = content.replace(/if\s*\(!session\)\s*(return|throw new Error\([^)]+\));?\n?/g, '');

  // 3. Remove Authorization header from fetch calls
  content = content.replace(/'Authorization':\s*`Bearer \$\{session(?:\??\.access_token)?\}`/g, '');
  // Clean up empty headers objects if any, or dangling commas
  content = content.replace(/headers:\s*\{\s*,\s*/g, 'headers: {');
  content = content.replace(/,\s*'Authorization':\s*`Bearer \$\{session(?:\??\.access_token)?\}`/g, '');
  content = content.replace(/'Authorization':\s*`Bearer \$\{session(?:\??\.access_token)?\}`\s*,/g, '');
  
  // 4. Ensure fetch calls have credentials: 'include'
  // Find all fetch('/api/...') and add credentials: 'include' if not present
  content = content.replace(/(fetch\([^,]+,\s*\{)([^}]+)\}/g, (match, p1, p2) => {
    if (!p2.includes('credentials')) {
      return `${p1} credentials: 'include', ${p2} }`;
    }
    return match;
  });
  
  // Clean up headers: {}
  content = content.replace(/headers:\s*\{\s*\}(,)?/g, '');

  // 5. Remove supabase.channel() logic
  // This is a bit tricky, but usually it looks like:
  // const channel = supabase.channel(...).on(...).subscribe();
  // return () => { supabase.removeChannel(channel); }
  content = content.replace(/const\s+channel\s*=\s*supabase\s*\.channel[\s\S]*?\.subscribe\(\);/g, '');
  content = content.replace(/return\s*\(\)\s*=>\s*\{\s*supabase\.removeChannel\(channel\);\s*\};/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(crmDir);
console.log('CRM frontend migration complete.');
