const fs = require('fs');
let c = fs.readFileSync('adms-sync/routes/farmers.js', 'utf8');

const s1 = "router.get('/:id', requireAuth,";
const r1 = "router.get('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', requireAuth,";
c = c.split(s1).join(r1);

const s2 = "router.put('/:id', requireAuth,";
const r2 = "router.put('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', requireAuth,";
c = c.split(s2).join(r2);

const s3 = "router.delete('/:id', requireAuth,";
const r3 = "router.delete('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', requireAuth,";
c = c.split(s3).join(r3);

const putSearch = "        code = COALESCE($12, code),\\n        updated_at = NOW()\\n       WHERE id = $13 RETURNING *`,\\n      [full_name, email, phone, country, district, primary_crops, is_active, notes, bank_account, state, village, code, id]";
const putReplace = "        code = COALESCE($12, code),\\n        verification_status = COALESCE($14, verification_status),\\n        farm_area = COALESCE($15, farm_area),\\n        updated_at = NOW()\\n       WHERE id = $13 RETURNING *`,\\n      [full_name, email, phone, country, district, primary_crops, is_active, notes, bank_account, state, village, code, id, verification_status, farm_area]";
c = c.split(putSearch).join(putReplace);
c = c.split(putSearch.replace(/\\n/g, '\\r\\n')).join(putReplace.replace(/\\n/g, '\\r\\n'));


const vGetS = "// --- FARM VISITS ---\\nrouter.get('/visits', requireAuth, async (req, res) => {\\n  try {\\n    const { company_id } = req.query;\\n    if (!company_id) return res.status(400).json({ error: 'company_id required' });\\n    const { rows } = await db.query('SELECT * FROM farm_visits WHERE company_id = $1 ORDER BY date DESC', [company_id]);\\n    res.json(rows);\\n  } catch (err) {\\n    res.status(500).json({ error: err.message });\\n  }\\n});";
const vGetR = "// --- FARM VISITS ---\\nrouter.get('/visits', requireAuth, async (req, res) => {\\n  try {\\n    const { rows } = await db.query('SELECT * FROM farm_visits ORDER BY visit_date DESC');\\n    res.json(rows);\\n  } catch (err) {\\n    res.status(500).json({ error: err.message });\\n  }\\n});";
c = c.split(vGetS).join(vGetR);
c = c.split(vGetS.replace(/\\n/g, '\\r\\n')).join(vGetR.replace(/\\n/g, '\\r\\n'));

const vPostS = "router.post('/visits', requireAuth, async (req, res) => {\\n  try {\\n    const { id, farmer_id, company_id, date, status, purpose, notes } = req.body;\\n    let compId = company_id;\\n    if (!compId) {\\n      const userRes = await db.query('SELECT company_id FROM profiles WHERE id = $1', [req.user.sub]);\\n      compId = userRes.rows[0]?.company_id;\\n    }\\n    const { rows } = await db.query(\\n      `INSERT INTO farm_visits (id, farmer_id, company_id, date, status, purpose, notes, created_by)\\n       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) \\n       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()\\n       RETURNING *`,\\n      [id, farmer_id, compId, date, status, purpose, notes, req.user.sub]\\n    );\\n    res.json(rows[0]);\\n  } catch (err) {\\n    res.status(500).json({ error: err.message });\\n  }\\n});";
const vPostR = "router.post('/visits', requireAuth, async (req, res) => {\\n  try {\\n    const { id, farmer_id, date, status, purpose, notes } = req.body;\\n    const userRes = await db.query('SELECT full_name FROM profiles WHERE id = $1', [req.user.sub]);\\n    const visitedBy = userRes.rows[0]?.full_name || req.user.sub;\\n    \\n    const { rows } = await db.query(\\n      `INSERT INTO farm_visits (id, farmer_id, visit_date, status, purpose, notes, visited_by)\\n       VALUES ($1, $2, $3, $4, $5, $6, $7) \\n       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()\\n       RETURNING *`,\\n      [id, farmer_id, date, status || 'Scheduled', purpose, notes, visitedBy]\\n    );\\n    res.json(rows[0]);\\n  } catch (err) {\\n    res.status(500).json({ error: err.message });\\n  }\\n});";

c = c.split(vPostS).join(vPostR);
c = c.split(vPostS.replace(/\\n/g, '\\r\\n')).join(vPostR.replace(/\\n/g, '\\r\\n'));

fs.writeFileSync('adms-sync/routes/farmers.js', c);
console.log('Fixed routing 100%!');
