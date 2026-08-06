const fs = require('fs');
let c = fs.readFileSync('adms-sync/routes/farmers.js', 'utf8');

c = c.replace('router.get(\\'' + '/:id\\'' + ', requireAuth, async (req, res) => {', 'router.get(\\'' + '/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\\'' + ', requireAuth, async (req, res) => {');
c = c.replace('router.put(\\'' + '/:id\\'' + ', requireAuth, async (req, res) => {', 'router.put(\\'' + '/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\\'' + ', requireAuth, async (req, res) => {');
c = c.replace('router.delete(\\'' + '/:id\\'' + ', requireAuth, async (req, res) => {', 'router.delete(\\'' + '/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\\'' + ', requireAuth, async (req, res) => {');

c = c.replace(
  `        code = COALESCE($12, code),
        updated_at = NOW()
       WHERE id = $13 RETURNING *`,
      [full_name, email, phone, country, district, primary_crops, is_active, notes, bank_account, state, village, code, id, verification_status, farm_area]`,
  `        code = COALESCE($12, code),
        verification_status = COALESCE($14, verification_status),
        farm_area = COALESCE($15, farm_area),
        updated_at = NOW()
       WHERE id = $13 RETURNING *`,
      [full_name, email, phone, country, district, primary_crops, is_active, notes, bank_account, state, village, code, id, verification_status, farm_area]`
);

c = c.replace(
  `// --- FARM VISITS ---
router.get('/visits', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const { rows } = await db.query('SELECT * FROM farm_visits WHERE company_id = $1 ORDER BY date DESC', [company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`,
  `// --- FARM VISITS ---
router.get('/visits', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM farm_visits ORDER BY visit_date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`
);

c = c.replace(
  `router.post('/visits', requireAuth, async (req, res) => {
  try {
    const { id, farmer_id, company_id, date, status, purpose, notes } = req.body;
    let compId = company_id;
    if (!compId) {
      const userRes = await db.query('SELECT company_id FROM profiles WHERE id = $1', [req.user.sub]);
      compId = userRes.rows[0]?.company_id;
    }
    const { rows } = await db.query(
      \`INSERT INTO farm_visits (id, farmer_id, company_id, date, status, purpose, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING *\`,
      [id, farmer_id, compId, date, status, purpose, notes, req.user.sub]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`,
  `router.post('/visits', requireAuth, async (req, res) => {
  try {
    const { id, farmer_id, date, status, purpose, notes } = req.body;
    const userRes = await db.query('SELECT full_name FROM profiles WHERE id = $1', [req.user.sub]);
    const visitedBy = userRes.rows[0]?.full_name || req.user.sub;
    
    const { rows } = await db.query(
      \`INSERT INTO farm_visits (id, farmer_id, visit_date, status, purpose, notes, visited_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING *\`,
      [id, farmer_id, date, status || 'Scheduled', purpose, notes, visitedBy]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`
);

fs.writeFileSync('adms-sync/routes/farmers.js', c);
console.log('Fixed route issues!');
