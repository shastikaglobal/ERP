const fs = require('fs');
const file = 'src/components/crm/CRMSecurityProvider.tsx';
let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const channel = vpsDb')) {
        // nullify channel lines
        for(let j=0; j<16; j++) {
            if(lines[i+j].includes('}, [profile?.company_id]);')) break;
            lines[i+j] = '';
        }
    }
    if (lines[i].includes('vpsDb.from("audit_logs").insert')) {
        for(let j=0; j<8; j++) {
            lines[i+j] = '';
        }
    }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Fixed');
