const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// ========== WORKFLOW ENDPOINTS - MUST BE DEFINED BEFORE /:id ROUTES ==========

// GET /api/leads/workflow/successful-conversations - Fetch Won leads (for Client Success)
router.get('/workflow/successful-conversations', requireAuth, async (req, res) => {
  try {
    const companyId = req.query.company_id;
    console.log(`[CRM] Fetching Successful Conversations (Optimized) for company: ${companyId}`);
    // Select specific fields to avoid potential issues with large/malformed JSON in other columns
    let query = `SELECT id, company_name, contact_name, email, phone, country, city, stage, created_at, assigned_to FROM leads WHERE stage = 'Won' AND is_deleted = false`;
    const params = [];
    if (companyId) {
      query += ` AND company_id = $1`;
      params.push(companyId);
    }
    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ [CRM] Error fetching successful conversations:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// GET /api/leads/workflow/client-acquisition - Fetch Client Successfully Acquired leads
router.get('/workflow/client-acquisition', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.query.company_id;
    const params = ['Client Successfully Acquired'];
    let query = `SELECT * FROM leads WHERE stage = $1 AND is_deleted = false`;
    if (companyId) {
      query += ` AND company_id = $${params.length + 1}`;
      params.push(companyId);
    }
    query += ` ORDER BY created_at DESC`;
    console.log(`[CRM] Fetching Client Acquisition for company: ${companyId}, user: ${userId}`);
    const result = await db.query(query, params);
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ [CRM] Error fetching client acquisition:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// GET /api/leads/workflow/lost-leads - Fetch Lost leads
router.get('/workflow/lost-leads', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.query.company_id;
    const params = [];
    let query = `SELECT * FROM leads WHERE stage = 'Lost' AND is_deleted = false`;
    if (companyId) {
      query += ` AND company_id = $${params.length + 1}`;
      params.push(companyId);
    }
    query += ` ORDER BY created_at DESC`;
    console.log(`[CRM] Fetching Lost Leads for company: ${companyId}, user: ${userId}`);
    const result = await db.query(query, params);
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ [CRM] Error fetching lost leads:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// GET /api/leads/workflow/won-leads - Fetch Won leads
router.get('/workflow/won-leads', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.query.company_id;
    const params = [];
    let query = `SELECT * FROM leads WHERE stage = 'Won' AND is_deleted = false`;
    if (companyId) {
      query += ` AND company_id = $${params.length + 1}`;
      params.push(companyId);
    }
    query += ` ORDER BY created_at DESC`;
    const result = await db.queryWithRLS(query, params, userId);
    res.json(result.rows || []);
  } catch (err) {
    console.error("DB Error (get won leads):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ========== STANDARD CRUD ENDPOINTS ==========

// GET /api/leads - Fetch all leads
router.get('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.query.company_id;
    const stage = req.query.stage;
    const stageIn = req.query.stage_in;
    const userId = req.user?.sub || req.user?.id;
    const params = [];
    let query = `SELECT * FROM leads WHERE (is_deleted IS FALSE OR is_deleted = false)`;
    if (companyId) {
      query += ` AND company_id = $${params.length + 1}`;
      params.push(companyId);
    }
    if (stage) {
      query += ` AND stage = $${params.length + 1}`;
      params.push(stage);
    } else if (stageIn) {
      const stages = String(stageIn).split(',').map(s => s.trim()).filter(Boolean);
      if (stages.length > 0) {
        query += ` AND stage = ANY($${params.length + 1}::text[])`;
        params.push(stages);
      }
    }
    query += ` ORDER BY created_at DESC`;
    const result = await db.queryWithRLS(query, params, userId);
    res.json(result.rows || []);
  } catch (err) {
    console.error("DB Error (get leads):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/:id - Fetch single lead
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const result = await db.queryWithRLS(
      `SELECT * FROM leads WHERE id = $1 AND (is_deleted IS FALSE OR is_deleted = false)`,
      [req.params.id],
      userId
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("DB Error (get single lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads - Create lead
router.post('/', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    data.created_by = req.user.sub || req.user.id;
    if (!data.company_id && data.created_by) {
      const { rows: profileRows } = await db.query('SELECT company_id FROM profiles WHERE id = $1', [data.created_by]);
      if (profileRows.length > 0) data.company_id = profileRows[0].company_id;
    }
    const keys = Object.keys(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');
    const values = Object.values(data);
    const { rows } = await db.query(`INSERT INTO leads (${columns}) VALUES (${placeholders}) RETURNING *`, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("DB Error (create lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/leads/:id - Update lead (Main automated handler for state changes)
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const userId = req.user?.sub || req.user?.id;

  try {
    // 1. Get current lead state for audit and validation
    const currentLeadRows = await db.queryWithRLS(
      'SELECT company_id, company_name, country, email, stage, contact_name FROM leads WHERE id = $1',
      [id],
      userId
    );

    if (currentLeadRows.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }
    const currentLead = currentLeadRows.rows[0];

    // 2. Automated Logic for "Won" or "Client Successfully Acquired" stage
    const conversionStages = ['Won', 'Client Successfully Acquired'];
    if (conversionStages.includes(updates.stage)) {
      // Logic handled primarily by Database Triggers now
      // We only store the converted_at timestamp here for tracking in the leads table
      if (!currentLead.converted_at) {
        updates.converted_at = new Date().toISOString();
      }

      // Log activity
      await db.query(`INSERT INTO lead_activities (lead_id, activity_type, note, created_by) VALUES ($1, $2, $3, $4)`,
        [id, 'stage_change', `Lead moved to conversion stage. Previous: ${currentLead.stage}, New: ${updates.stage}`, userId]);
    }

    // 3. Build and execute standard update
    if (Object.keys(updates).length === 0) return res.json({ success: true });

    const setClauses = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`"${key}" = $${idx}`);
      values.push(value);
      idx++;
    }
    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE leads SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.queryWithRLS(query, values, userId);

    res.json({
      success: true,
      message: conversionStages.includes(updates.stage) ? "Lead successfully converted and moved to workflow." : "Lead updated successfully.",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("DB Error (update lead):", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// DELETE /api/leads/:id - Soft delete
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE leads SET is_deleted = true, deleted_at = $1 WHERE id = $2', [new Date().toISOString(), id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (delete lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/meta/sources - Fetch acquisition channels
router.get('/meta/sources', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.query.company_id;
    const params = [];
    let query = `SELECT id, channel_name, avg_lead_cost, company_id FROM acquisition_channels`;
    if (companyId) {
      query += ` WHERE company_id = $1`;
      params.push(companyId);
    }
    query += ` ORDER BY channel_name`;
    const result = await db.queryWithRLS(query, params, userId);
    res.json(result.rows || []);
  } catch (err) {
    console.error("DB Error (get sources):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/meta/sources - Create acquisition channel
router.post('/meta/sources', requireAuth, async (req, res) => {
  try {
    const { company_id, channel_name, avg_lead_cost } = req.body;
    if (!company_id || !channel_name) return res.status(400).json({ error: "company_id and channel_name are required" });
    const userId = req.user?.sub || req.user?.id;
    const result = await db.queryWithRLS(
      `INSERT INTO acquisition_channels (company_id, channel_name, avg_lead_cost) VALUES ($1, $2, $3) RETURNING *`,
      [company_id, channel_name, avg_lead_cost || 0],
      userId
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("DB Error (create source):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/:id/convert - Convert lead to customer
router.post('/:id/convert', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, name, country, email } = req.body;
    await db.query('BEGIN');
    await db.query('INSERT INTO customers (company_id, name, country, email) VALUES ($1, $2, $3, $4)', [company_id, name, country, email]);
    await db.query(`UPDATE leads SET stage = 'Client Successfully Acquired' WHERE id = $1`, [id]);
    await db.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error("DB Error (convert lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/:id/follow-ups - Add follow up and update assignee
router.post('/:id/follow-ups', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, contact_name, follow_up_date, note, assigned_to } = req.body;
    await db.query(`INSERT INTO follow_ups (lead_id, company_name, contact_name, follow_up_date, note, assigned_to, is_notified) VALUES ($1, $2, $3, $4, $5, $6, false)`, [id, company_name, contact_name, follow_up_date, note, assigned_to]);
    await db.query('UPDATE leads SET assigned_to = $1 WHERE id = $2', [assigned_to, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (add follow-up):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/:id/activities - Fetch lead activities
router.get('/:id/activities', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`SELECT a.*, p.full_name as profile_full_name FROM lead_activities a LEFT JOIN profiles p ON a.created_by = p.id::text WHERE a.lead_id = $1 ORDER BY a.created_at DESC`, [id]);
    const formatted = rows.map(r => ({ ...r, profiles: { full_name: r.profile_full_name } }));
    res.json(formatted);
  } catch (err) {
    console.error("DB Error (get lead activities):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/:id/quotations - Fetch lead quotations
router.get('/:id/quotations', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT id, quotation_number, status, created_at, amount, currency FROM quotations WHERE lead_id = $1 ORDER BY created_at DESC', [id]);
    res.json(rows);
  } catch (err) {
    console.error("DB Error (get lead quotations):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/:id/activities - Add activity
router.post('/:id/activities', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    data.lead_id = id;
    data.created_by = req.user.sub || req.user.id;
    const keys = Object.keys(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');
    const values = Object.values(data);
    const { rows } = await db.query(`INSERT INTO lead_activities (${columns}) VALUES (${placeholders}) RETURNING *`, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("DB Error (create lead activity):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
