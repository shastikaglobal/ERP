const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.ts') || file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}

let files = walk('src');
for(let f of files) {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('vpsDb')) {
        if (!content.includes('import { vpsDb }') && !content.includes('import {vpsDb}') && !content.includes('import { createClient }')) {
            content = 'import { vpsDb } from "@/lib/vpsDb";\n' + content;
            fs.writeFileSync(f, content, 'utf8');
            console.log('Fixed missing import in: ' + f);
        }
    }
}
