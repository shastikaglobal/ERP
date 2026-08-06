import sys

filename = 'adms-sync/routes/farmers.js'
with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("router.get('/:id', requireAuth,", "router.get('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', requireAuth,")
content = content.replace("router.put('/:id', requireAuth,", "router.put('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', requireAuth,")
content = content.replace("router.delete('/:id', requireAuth,", "router.delete('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', requireAuth,")

# Fix the PUT set clause
put_search = """        code = COALESCE($12, code),
        updated_at = NOW()
       WHERE id = $13 RETURNING *`,
      [full_name, email, phone, country, district, primary_crops, is_active, notes, bank_account, state, village, code, id, verification_status, farm_area]"""

put_replace = """        code = COALESCE($12, code),
        verification_status = COALESCE($14, verification_status),
        farm_area = COALESCE($15, farm_area),
        updated_at = NOW()
       WHERE id = $13 RETURNING *`,
      [full_name, email, phone, country, district, primary_crops, is_active, notes, bank_account, state, village, code, id, verification_status, farm_area]"""

content = content.replace(put_search, put_replace)
content = content.replace(put_search.replace('\n', '\r\n'), put_replace.replace('\n', '\r\n'))

# Fix GET /visits
get_visits_search = """// --- FARM VISITS ---
router.get('/visits', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const { rows } = await db.query('SELECT * FROM farm_visits WHERE company_id = $1 ORDER BY date DESC', [company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});"""

get_visits_replace = """// --- FARM VISITS ---
router.get('/visits', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM farm_visits ORDER BY visit_date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});"""

content = content.replace(get_visits_search, get_visits_replace)
content = content.replace(get_visits_search.replace('\n', '\r\n'), get_visits_replace.replace('\n', '\r\n'))

# Fix POST /visits
post_visits_search = """router.post('/visits', requireAuth, async (req, res) => {
  try {
    const { id, farmer_id, company_id, date, status, purpose, notes } = req.body;
    let compId = company_id;
    if (!compId) {
      const userRes = await db.query('SELECT company_id FROM profiles WHERE id = $1', [req.user.sub]);
      compId = userRes.rows[0]?.company_id;
    }
    const { rows } = await db.query(
      `INSERT INTO farm_visits (id, farmer_id, company_id, date, status, purpose, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING *`,
      [id, farmer_id, compId, date, status, purpose, notes, req.user.sub]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});"""

post_visits_replace = """router.post('/visits', requireAuth, async (req, res) => {
  try {
    const { id, farmer_id, date, status, purpose, notes } = req.body;
    const userRes = await db.query('SELECT full_name FROM profiles WHERE id = $1', [req.user.sub]);
    const visitedBy = userRes.rows[0]?.full_name || req.user.sub;
    
    const { rows } = await db.query(
      `INSERT INTO farm_visits (id, farmer_id, visit_date, status, purpose, notes, visited_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING *`,
      [id, farmer_id, date, status || 'Scheduled', purpose, notes, visitedBy]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});"""

content = content.replace(post_visits_search, post_visits_replace)
content = content.replace(post_visits_search.replace('\n', '\r\n'), post_visits_replace.replace('\n', '\r\n'))


with open(filename, 'w', encoding='utf-8') as f:
    f.write(content)

print("Python script completed.")
