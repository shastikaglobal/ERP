const fs = require('fs');
const file = 'adms-sync/server.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "await db.query('UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, \\nuserId]);",
  "await db.query('UPDATE profiles SET password_hash = $1, force_password_reset = false, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);"
);

// Account for possible line breaks from grep output
content = content.replace(
  "await db.query('UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, \nuserId]);",
  "await db.query('UPDATE profiles SET password_hash = $1, force_password_reset = false, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);"
);

// One more try just matching the exact string without line breaks
content = content.replace(
  "await db.query('UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);",
  "await db.query('UPDATE profiles SET password_hash = $1, force_password_reset = false, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);"
);


fs.writeFileSync(file, content);
console.log('Fixed server.js PUT update-password');
