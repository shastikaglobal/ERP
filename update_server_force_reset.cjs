const fs = require('fs');
const file = 'adms-sync/server.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'SELECT id, full_name, email, role, status, password_hash FROM profiles WHERE email = $1 AND is_deleted IS NOT TRUE LIMIT 1',
  'SELECT id, full_name, email, role, status, password_hash, force_password_reset FROM profiles WHERE email = $1 AND is_deleted IS NOT TRUE LIMIT 1'
);

content = content.replace(
  `          user_metadata: { full_name: user.full_name }`,
  `          user_metadata: { full_name: user.full_name, force_password_reset: user.force_password_reset }`
);

content = content.replace(
  'SELECT id, full_name, email, role, status FROM profiles WHERE id = $1 LIMIT 1',
  'SELECT id, full_name, email, role, status, force_password_reset FROM profiles WHERE id = $1 LIMIT 1'
);

fs.writeFileSync(file, content);
console.log('Fixed server.js');
