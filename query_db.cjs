const db = require('./db');
Promise.all([
  db.query('SELECT id, company_id, crop, quantity FROM commitments ORDER BY created_at DESC LIMIT 3'),
  db.query('SELECT id, company_id, crop, quantity_collected FROM collections ORDER BY created_at DESC LIMIT 3')
]).then(([c, col]) => {
  console.log('COMMITMENTS:', JSON.stringify(c.rows));
  console.log('COLLECTIONS:', JSON.stringify(col.rows));
}).catch(e => console.error(e.message));
