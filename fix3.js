const fs = require('fs');
let c = fs.readFileSync('adms-sync/routes/farmers.js', 'utf8');

c = c.split("router.get('/:id', requireAuth").join("router.get('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', requireAuth");
c = c.split("router.put('/:id', requireAuth").join("router.put('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', requireAuth");
c = c.split("router.delete('/:id', requireAuth").join("router.delete('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', requireAuth");

const putSearch = "        code = COALESCE($12, code),\\n        updated_at = NOW()\\n       WHERE id = $13 RETURNING *`,\\n      [full_name, email, phone, country, district, primary_crops, is_active, notes, bank_account, state, village, code, id]";
const putReplace = "        code = COALESCE($12, code),\\n        verification_status = COALESCE($14, verification_status),\\n        farm_area = COALESCE($15, farm_area),\\n        updated_at = NOW()\\n       WHERE id = $13 RETURNING *`,\\n      [full_name, email, phone, country, district, primary_crops, is_active, notes, bank_account, state, village, code, id, verification_status, farm_area]";
c = c.replace(putSearch, putReplace);

fs.writeFileSync('adms-sync/routes/farmers.js', c);
console.log('Fixed routing');
