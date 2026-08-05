const fs = require('fs');

const files = fs.readdirSync('routes').filter(f => f.endsWith('.js') && !f.includes('.backup'));
let modifiedCount = 0;

for (let file of files) {
  let filepath = 'routes/' + file;
  let code = fs.readFileSync(filepath, 'utf8');
  let originalCode = code;

  // 1. SELECT replaces
  code = code.replace(/is_deleted\s*=\s*false/g, "deleted_at IS NULL");
  code = code.replace(/is_deleted\s*IS\s+NOT\s+TRUE/g, "deleted_at IS NULL");

  // 2. DELETE FROM -> UPDATE for standard tables
  code = code.replace(/DELETE FROM\s+(\w+)\s+WHERE\s+id\s*=\s*\$1/g, 
    "UPDATE $1 SET deleted_at = NOW(), deleted_by = \\$2 WHERE id = \\$1");
    
  // 3. DELETE FROM ${table} -> UPDATE
  code = code.replace(/DELETE FROM\s+\\?\$?\{?table\}?\s+WHERE\s+id\s*=\s*\$1/g, 
    "UPDATE \\${table} SET deleted_at = NOW(), deleted_by = \\$2 WHERE id = \\$1");

  // 4. Update the parameter arrays to include req.user.sub
  // For queries that were just transformed to UPDATE ... deleted_by = $2 WHERE id = $1
  // We need to add req.user.sub to the array
  code = code.replace(/db\.query\(\s*[`'"]UPDATE(.*?)WHERE id = \\?\$1[`'"],\s*\[\s*([^\]]+)\s*\]\s*\)/g, (match, queryStr, params) => {
    // If params already includes req.user, don't add it again
    if (params.includes('req.user') || params.includes('req.admin')) return match;
    // Otherwise add it
    return `db.query(\`UPDATE${queryStr}WHERE id = \\$1\`, [${params}, req.user?.sub || req.user?.id])`;
  });

  // 5. UPDATE SET is_deleted = true -> deleted_at = NOW()
  code = code.replace(/UPDATE\s+(\w+)\s+SET\s+is_deleted\s*=\s*true(.*?)(WHERE\s+id\s*=\s*\$[0-9]+)/g, (match, table, rest, whereClause) => {
    if (match.includes('deleted_at = NOW()')) return match;
    return `UPDATE ${table} SET deleted_at = NOW(), deleted_by = \\$2 ${whereClause}`;
  });

  if (code !== originalCode) {
    fs.writeFileSync(filepath, code, 'utf8');
    modifiedCount++;
  }
}
console.log('Modified files:', modifiedCount);
