const fs = require('fs');

let f1 = 'src/pages/employees/EmployeeDirectory.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/const profileChannel = vpsDb[\s\S]*?\.subscribe\(\);/g, '/* profileChannel removed */');
c1 = c1.replace(/const sessionChannel = vpsDb[\s\S]*?\.subscribe\(\);/g, '/* sessionChannel removed */');
fs.writeFileSync(f1, c1);

let f2 = 'src/pages/employees/Attendance.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/const channel = vpsDb[\s\S]*?\.subscribe\(\);/g, '/* channel removed */');
fs.writeFileSync(f2, c2);

console.log('Done');
