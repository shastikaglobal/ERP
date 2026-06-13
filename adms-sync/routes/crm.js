const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// ========== WORKFLOW ENDPOINTS - MUST BE DEFINED BEFORE /:id ROUTES ==========

// GET /api/leads/workflow/successful-conversations - Fetch Won leads (for Client Success)
// Data Fetching Rule: Fetch all leads where stage = "Won"
router.get('/workflow/successful-conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.query.company_id;
    
    const params = ['Won'];
    let query = `
      SELECT * FROM leads 
      WHERE stage = $1 AND is_deleted = false
    `;

    if (companyId) {
      query += ` AND company_id = $${params.length + 1}`;
      params.push(companyId);
    }

    query += ` ORDER BY created_at DESC`;
    
    console.log(`[CRM Workflow] Fetching successful-conversations (Won leads) for user ${userId}, company: ${companyId}`);
    
    const result = await db.queryWithRLS(query, params, userId);
    console.log(`[CRM Workflow] Returned ${result.rows.length} Won leads`);
    res.json(result.rows || []);
  } catch (err) {
    console.error("DB Error (get successful conversations):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/workflow/client-acquisition - Fetch Client Successfully Acquired leads
// Data Fetching Rule: Fetch all leads where stage = "Client Successfully Acquired"
router.get('/workflow/client-acquisition', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.query.company_id;
    
    const params = ['Client Successfully Acquired'];
    let query = `
      SELECT * FROM leads 
      WHERE stage = $1 AND is_deleted = false
    `;

    if (companyId) {
      query += ` AND company_id = $${params.length + 1}`;
      params.push(companyId);
    }

    query += ` ORDER BY created_at DESC`;
    
    console.log(`[CRM Workflow] Fetching client-acquisition (Client Successfully Acquired leads) for user ${userId}, company: ${companyId}`);
    
    const result = await db.queryWithRLS(query, params, userId);
    console.log(`[CRM Workflow] Returned ${result.rows.length} Client Successfully Acquired leads`);
    res.json(result.rows || []);
  } catch (err) {
    console.error("DB Error (get client acquisition):", err);
    res.status(500).json({ error: "Internal Server Error" });
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
    
    const result = await db.queryWithRLS(query, params, userId);
    res.json(result.rows || []);
  } catch (err) {
    console.error("DB Error (get lost leads):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/workflow/won-leads - Fetch Won leads (direct from leads table)
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

// GET /api/leads - Fetch all leads, optionally scoped by company_id and stage filters
router.get('/', requireAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const { rows } = await db.query('SELECT * FROM leads WHERE is_deleted IS NOT TRUE ORDER BY created_at DESC');
    res.json(rows);
=======
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
      const stages = String(stageIn)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      if (stages.length > 0) {
        query += ` AND stage = ANY($${params.length + 1}::text[])`;
        params.push(stages);
      }
    }

    query += ` ORDER BY created_at DESC`;
    const result = await db.queryWithRLS(query, params, userId);
    res.json(result.rows || []);
>>>>>>> cea8f4d (Fix: align CRM stages and pipeline; include Client Successfully Acquired)
  } catch (err) {
    console.error("DB Error (get leads):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/:id - Fetch single lead
router.get('/:id', requireAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM leads WHERE id = $1 AND is_deleted IS NOT TRUE', [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
=======
    const userId = req.user?.sub || req.user?.id;
    const result = await db.queryWithRLS(
      `SELECT * FROM leads WHERE id = $1 AND (is_deleted IS FALSE OR is_deleted = false)`,
      [req.params.id],
      userId
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
>>>>>>> cea8f4d (Fix: align CRM stages and pipeline; include Client Successfully Acquired)
  } catch (err) {
    console.error("DB Error (get single lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads - Create lead
router.post('/', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    data.created_by = req.user.sub;

    // Fetch user's company_id from profiles if not provided
    if (!data.company_id && data.created_by) {
      const { rows: profileRows } = await db.query(
        'SELECT company_id FROM profiles WHERE id = $1',
        [data.created_by]
      );
      if (profileRows.length > 0 && profileRows[0].company_id) {
        data.company_id = profileRows[0].company_id;
      }
    }

    const keys = Object.keys(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');
    const values = Object.values(data);

    const { rows } = await db.query(
      `INSERT INTO leads (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("DB Error (create lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', requireAuth, async (req, res) => {
  console.log(`[DEBUG] PUT /api/leads/${req.params.id} body:`, req.body);
  try {
<<<<<<< HEAD
    const { id } = req.params;
    const updates = req.body;
=======
    const leadId = req.params.id;
    const updates = req.body || {};
    const userId = req.user?.sub || req.user?.id || 'unknown';

    console.log(`[CRM Lead Update] Request to update lead ${leadId}`, {
      updates,
      userId,
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body || {})
    });

    if (Object.keys(updates).length === 0) {
      console.warn(`[CRM Lead Update] No updates provided for lead ${leadId}`);
      return res.status(400).json({ error: "No updates provided" });
    }

    if ('stage' in updates) {
      if (updates.stage === null || updates.stage === undefined || updates.stage === '') {
        console.warn(`[CRM Lead Update] Invalid stage value for lead ${leadId}`);
        return res.status(400).json({ error: "Stage value is required" });
      }
      console.log(`[CRM Lead Update] Lead ${leadId} stage update: "${updates.stage}" by user ${userId}`);
    }
>>>>>>> cea8f4d (Fix: align CRM stages and pipeline; include Client Successfully Acquired)

    const keys = Object.keys(updates);
    if (keys.length === 0) return res.json({ success: true });

<<<<<<< HEAD
    if (updates.stage === 'Won' || updates.stage === 'Client Successfully Acquired') {
      // Automatically convert to customer if not already converted
      const leadCheck = await db.query('SELECT company_id, company_name, country, email FROM leads WHERE id = $1', [id]);
      if (leadCheck.rows.length > 0) {
        const leadData = leadCheck.rows[0];

        let cmpId = leadData.company_id;
        if (!cmpId && req.user && req.user.sub) {
          const empCheck = await db.query('SELECT company_id FROM profiles WHERE id = $1', [req.user.sub]);
          if (empCheck.rows.length > 0) cmpId = empCheck.rows[0].company_id;
        }

        if (cmpId) {
          // Check if already in customers to avoid duplicates
          const custCheck = await db.query('SELECT id FROM customers WHERE email = $1 AND name = $2', [leadData.email, leadData.company_name]);
          if (custCheck.rows.length === 0) {
            await db.query(
              `INSERT INTO customers (company_id, name, country, email) VALUES ($1, $2, $3, $4)`,
              [cmpId, leadData.company_name, leadData.country, leadData.email]
            );
          }
        } else {
          console.error("Skipping conversion: no valid company_id found for lead", id);
        }
      }
      updates.stage = 'Client Successfully Acquired';
    }

    const setClause = keys.map((key, i) => `"${key}" = $${i + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];

    await db.query(`UPDATE leads SET ${setClause} WHERE id = $1`, values);
    res.json({ success: true });
=======
    // Build SET clauses - only update provided fields
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    // Add updated_at timestamp
    setClauses.push(`updated_at = NOW()`);

    // Prepare the WHERE clause
    const leadIdParam = `$${idx}`;
    values.push(leadId);

    const query = `UPDATE leads SET ${setClauses.join(', ')} WHERE id = ${leadIdParam} RETURNING *`;
    console.log(`[CRM Lead Update] SQL Query:`, query);
    console.log(`[CRM Lead Update] SQL Values:`, values);

    // Use queryWithRLS to set auth context for RLS policies
    const result = await db.queryWithRLS(query, values, userId);

    if (result.rows.length === 0) {
      console.warn(`[CRM Lead Update] Lead ${leadId} not found for update (RLS may have blocked it)`);
      return res.status(404).json({ error: "Lead not found or no permission to update" });
    }

    console.log(`[CRM Lead Update] Successfully updated lead ${leadId}`, {
      stage: result.rows[0].stage,
      updatedAt: result.rows[0].updated_at,
    });

    res.json({ success: true, data: result.rows[0] });
>>>>>>> cea8f4d (Fix: align CRM stages and pipeline; include Client Successfully Acquired)
  } catch (err) {
    console.error(`[CRM Lead Update] DB Error for lead ${req.params.id}:`, err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// DELETE /api/leads/:id - Delete lead (Soft delete)
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

// GET /api/leads/meta/sources - Fetch acquisition channels, optionally scoped by company_id
router.get('/meta/sources', requireAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const { rows } = await db.query('SELECT id, channel_name FROM acquisition_channels ORDER BY channel_name');
    res.json(rows);
=======
    const companyId = req.query.company_id;
    const params = [];
    let query = `SELECT id, channel_name, avg_lead_cost, company_id FROM acquisition_channels`;

    if (companyId) {
      query += ` WHERE company_id = $1`;
      params.push(companyId);
    }

    query += ` ORDER BY channel_name`;
    const result = await db.query(query, params);
    res.json(result.rows || []);
>>>>>>> cea8f4d (Fix: align CRM stages and pipeline; include Client Successfully Acquired)
  } catch (err) {
    console.error("DB Error (get sources):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/meta/sources - Create acquisition channel via backend
router.post('/meta/sources', requireAuth, async (req, res) => {
  try {
    const { company_id, channel_name, avg_lead_cost } = req.body;
    if (!company_id || !channel_name) {
      return res.status(400).json({ error: "company_id and channel_name are required" });
    }

    const result = await db.query(
      `INSERT INTO acquisition_channels (company_id, channel_name, avg_lead_cost) VALUES ($1, $2, $3) RETURNING *`,
      [company_id, channel_name, avg_lead_cost || 0]
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

    // Insert into customers
    await db.query(
      'INSERT INTO customers (company_id, name, country, email) VALUES ($1, $2, $3, $4)',
      [company_id, name, country, email]
    );
    await db.query(
      `UPDATE leads SET stage = 'Client Successfully Acquired' WHERE id = $1 AND stage != 'Client Successfully Acquired'`,
      [id]
    );

    await db.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (convert lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/:id/follow-ups - Add follow up and update assignee
router.post('/:id/follow-ups', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, contact_name, follow_up_date, note, assigned_to } = req.body;

    await db.query(
      `INSERT INTO follow_ups (lead_id, company_name, contact_name, follow_up_date, note, assigned_to, is_notified) 
       VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [id, company_name, contact_name, follow_up_date, note, assigned_to]
    );

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
    const { rows } = await db.query(
      `SELECT a.*, p.full_name as profile_full_name 
       FROM lead_activities a
       LEFT JOIN profiles p ON a.created_by = p.id::text
       WHERE a.lead_id = $1 
       ORDER BY a.created_at DESC`,
      [id]
    );

    // Format to match Supabase nested structure: profiles: { full_name }
    const formatted = rows.map(r => {
      const { profile_full_name, ...rest } = r;
      return {
        ...rest,
        profiles: { full_name: profile_full_name }
      };
    });

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
    const { rows } = await db.query(
      'SELECT id, quotation_number, status, created_at, amount, currency FROM quotations WHERE lead_id = $1 ORDER BY created_at DESC',
      [id]
    );
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
    data.created_by = req.user.sub;

    const keys = Object.keys(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');
    const values = Object.values(data);

    const { rows } = await db.query(
      `INSERT INTO lead_activities (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("DB Error (create lead activity):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
