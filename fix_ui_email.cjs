const fs = require('fs');

let f1 = fs.readFileSync('src/components/ResetPasswordModal.tsx', 'utf8');
f1 = f1.replace(/shastikaglobal11@gmail\.com/g, '${email}');
f1 = f1.replace(/with them to securely/g, 'your inbox to securely');
f1 = f1.replace(/to \$\{email\}\."\}/g, 'to it."}');
fs.writeFileSync('src/components/ResetPasswordModal.tsx', f1);

let f2 = fs.readFileSync('src/pages/employees/EmployeeDirectory.tsx', 'utf8');
f2 = f2.replace(/Password reset link sent to shastikaglobal11@gmail\.com/g, "Password reset link sent successfully to the user's email.");
fs.writeFileSync('src/pages/employees/EmployeeDirectory.tsx', f2);
