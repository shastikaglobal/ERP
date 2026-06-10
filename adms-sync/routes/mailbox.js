const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/emails/accounts - Fetch zoho accounts
router.get('/accounts', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM zoho_accounts');
    res.json(rows);
  } catch (err) {
    console.error("DB Error (get zoho accounts):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/emails - Fetch emails (with optional account_id filter)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { account_id } = req.query;
    let query = 'SELECT * FROM emails';
    let params = [];
    if (account_id) {
      query += ' WHERE account_id = $1';
      params.push(account_id);
    }
    query += ' ORDER BY received_at DESC LIMIT 500';
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("DB Error (get emails):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/emails/:id - Fetch single email
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM emails WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Email not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("DB Error (get single email):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/emails/:id - Update email (e.g. status, is_read)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const keys = Object.keys(updates);
    if (keys.length === 0) return res.json({ success: true });
    
    const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    
    await db.query(`UPDATE emails SET ${setClause} WHERE id = $1`, values);
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (update email):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/emails - Save sent email log
router.post('/', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    // user ID might be passed from frontend or taken from token
    if (!data.user_id) {
      data.user_id = req.user.sub;
    }
    
    const keys = Object.keys(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');
    const values = Object.values(data);
    
    const { rows } = await db.query(
      `INSERT INTO emails (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("DB Error (create email log):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/emails/:id - Delete email log
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Hard delete or soft delete? Assuming hard delete for now, if table doesn't have is_deleted
    await db.query('DELETE FROM emails WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (delete email):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
