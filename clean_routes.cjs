const fs = require('fs');
const path = require('path');

function fix(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fix(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const before = content;
      
      // Remove the supabase client setup block (several patterns)
      content = content.replace(/\n?const nodeFetch = require\('node-fetch'\);\n\nconst SUPABASE_URL[^;]+;\nconst SUPABASE_SERVICE_ROLE_KEY[^;]+;\nconst supabase[\s\S]*?: null;\n/g, '\n');
      content = content.replace(/\n?const SUPABASE_URL[^;]+;\n?const SUPABASE_SERVICE_ROLE_KEY[^;]+;\n?const supabase[\s\S]*?: null;\n/g, '\n');
      content = content.replace(/const supabase = createClient[\s\S]*?;\n/g, '');
      content = content.replace(/const \{ createClient \}[^\n]+\n/g, '');
      
      if (content !== before) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed:', fullPath);
      }
    }
  });
}

fix('adms-sync/routes');
fix('adms-sync/middleware');
