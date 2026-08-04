const fs = require('fs');
let content = fs.readFileSync('adms-sync/routes/auth.js', 'utf8');
content = content.replace(
  'SELECT id, full_name, email, role, status, force_password_reset FROM profiles WHERE id = $1 LIMIT 1',
  'SELECT id, company_id, full_name, email, avatar_url, status, requested_role, rejection_reason, phone, dob, joining_date, system_mode, city, biometric_id, department, employee_id, role, force_password_reset FROM profiles WHERE id = $1 LIMIT 1'
);
fs.writeFileSync('adms-sync/routes/auth.js', content);
console.log('done');
