const fs = require('fs');
const path = require('path');

const farmersPath = path.join(__dirname, 'routes', 'farmers.js');
let content = fs.readFileSync(farmersPath, 'utf8');

// Ensure we append before `module.exports = router;`
content = content.replace(/module\.exports\s*=\s*router;/, '');

const newRoutes = `
// --- FARM VISITS ---
router.get('/visits', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const { rows } = await db.query('SELECT * FROM farm_visits WHERE company_id = $1 ORDER BY date DESC', [company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/visits', requireAuth, async (req, res) => {
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
});

// --- CONTRACT FARMING ---
router.get('/contracts', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const { rows } = await db.query('SELECT * FROM contract_farming WHERE company_id = $1 ORDER BY created_at DESC', [company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/contracts', requireAuth, async (req, res) => {
  try {
    const { farmer_id, company_id, crop, status, start_date, end_date, terms } = req.body;
    let compId = company_id;
    if (!compId) {
      const userRes = await db.query('SELECT company_id FROM profiles WHERE id = $1', [req.user.sub]);
      compId = userRes.rows[0]?.company_id;
    }
    const { rows } = await db.query(
      \`INSERT INTO contract_farming (farmer_id, company_id, crop, status, start_date, end_date, terms, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *\`,
      [farmer_id, compId, crop, status, start_date, end_date, terms, req.user.sub]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- COMMITMENTS ---
router.get('/commitments', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const { rows } = await db.query('SELECT * FROM commitments WHERE company_id = $1 ORDER BY created_at DESC', [company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/commitments', requireAuth, async (req, res) => {
  try {
    const { farmer_id, company_id, crop, status, quantity, price_per_unit, delivery_date } = req.body;
    let compId = company_id;
    if (!compId) {
      const userRes = await db.query('SELECT company_id FROM profiles WHERE id = $1', [req.user.sub]);
      compId = userRes.rows[0]?.company_id;
    }
    const { rows } = await db.query(
      \`INSERT INTO commitments (farmer_id, company_id, crop, status, quantity, price_per_unit, delivery_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *\`,
      [farmer_id, compId, crop, status, quantity, price_per_unit, delivery_date, req.user.sub]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- COLLECTIONS ---
router.get('/collections', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const { rows } = await db.query('SELECT * FROM collections WHERE company_id = $1 ORDER BY created_at DESC', [company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/collections', requireAuth, async (req, res) => {
  try {
    const { farmer_id, company_id, crop, status, quantity_collected, quality_grade, collection_date } = req.body;
    let compId = company_id;
    if (!compId) {
      const userRes = await db.query('SELECT company_id FROM profiles WHERE id = $1', [req.user.sub]);
      compId = userRes.rows[0]?.company_id;
    }
    const { rows } = await db.query(
      \`INSERT INTO collections (farmer_id, company_id, crop, status, quantity_collected, quality_grade, collection_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *\`,
      [farmer_id, compId, crop, status, quantity_collected, quality_grade, collection_date, req.user.sub]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PAYOUTS ---
router.get('/payouts', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const { rows } = await db.query('SELECT * FROM payouts WHERE company_id = $1 ORDER BY created_at DESC', [company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payouts', requireAuth, async (req, res) => {
  try {
    const { farmer_id, company_id, amount, status, payout_date, reference_number, notes } = req.body;
    let compId = company_id;
    if (!compId) {
      const userRes = await db.query('SELECT company_id FROM profiles WHERE id = $1', [req.user.sub]);
      compId = userRes.rows[0]?.company_id;
    }
    const { rows } = await db.query(
      \`INSERT INTO payouts (farmer_id, company_id, amount, status, payout_date, reference_number, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *\`,
      [farmer_id, compId, amount, status, payout_date, reference_number, notes, req.user.sub]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RATINGS ---
router.get('/ratings', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const { rows } = await db.query('SELECT * FROM farmer_ratings WHERE company_id = $1 ORDER BY created_at DESC', [company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ratings', requireAuth, async (req, res) => {
  try {
    const { farmer_id, company_id, score, review } = req.body;
    let compId = company_id;
    if (!compId) {
      const userRes = await db.query('SELECT company_id FROM profiles WHERE id = $1', [req.user.sub]);
      compId = userRes.rows[0]?.company_id;
    }
    const { rows } = await db.query(
      \`INSERT INTO farmer_ratings (farmer_id, company_id, score, review, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *\`,
      [farmer_id, compId, score, review, req.user.sub]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DOCUMENTS ---
router.get('/documents', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const { rows } = await db.query('SELECT * FROM farmer_documents WHERE company_id = $1 ORDER BY created_at DESC', [company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/documents', requireAuth, async (req, res) => {
  try {
    const { farmer_id, company_id, doc_name, doc_type, url } = req.body;
    let compId = company_id;
    if (!compId) {
      const userRes = await db.query('SELECT company_id FROM profiles WHERE id = $1', [req.user.sub]);
      compId = userRes.rows[0]?.company_id;
    }
    const { rows } = await db.query(
      \`INSERT INTO farmer_documents (farmer_id, company_id, doc_name, doc_type, url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *\`,
      [farmer_id, compId, doc_name, doc_type, url, req.user.sub]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TICKETS (SUPPORT) ---
router.get('/tickets', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const { rows } = await db.query('SELECT * FROM farmer_support WHERE company_id = $1 ORDER BY created_at DESC', [company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tickets', requireAuth, async (req, res) => {
  try {
    const { farmer_id, company_id, issue, status, resolution } = req.body;
    let compId = company_id;
    if (!compId) {
      const userRes = await db.query('SELECT company_id FROM profiles WHERE id = $1', [req.user.sub]);
      compId = userRes.rows[0]?.company_id;
    }
    const { rows } = await db.query(
      \`INSERT INTO farmer_support (farmer_id, company_id, issue, status, resolution, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *\`,
      [farmer_id, compId, issue, status, resolution, req.user.sub]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
`;

fs.writeFileSync(farmersPath, content + newRoutes, 'utf8');
console.log('Successfully appended routes to farmers.js');
