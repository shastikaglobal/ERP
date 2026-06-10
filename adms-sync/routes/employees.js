const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/employees - Fetch all approved employees
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, full_name, email, phone, requested_role, status, is_active, avatar_url, biometric_id, dob, joining_date, system_mode, city
       FROM profiles 
       WHERE status = 'approved' AND is_deleted IS NOT TRUE
       ORDER BY full_name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("DB Error (get employees):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/employees/:id - Fetch single employee
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM profiles WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("DB Error (get employee):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/employees - Add new employee (Profile creation usually via Auth, but provided for completeness)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { id, full_name, email, requested_role } = req.body;
    await db.query(
      `INSERT INTO profiles (id, full_name, email, requested_role, status) VALUES ($1, $2, $3, $4, 'approved')`,
      [id, full_name, email, requested_role]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (post employee):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Dynamically build the update query
    const keys = Object.keys(updates);
    if (keys.length === 0) return res.json({ success: true });
    
    const setClause = keys.map((key, i) => `"${key}" = $${i + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    
    await db.query(`UPDATE profiles SET ${setClause} WHERE id = $1`, values);
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (update employee):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/employees/:id - Soft delete employee
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.user.sub;
    const deleted_at = new Date().toISOString();
    
    await db.query(
      `UPDATE profiles SET is_active = false, is_deleted = true, deleted_at = $1, deleted_by = $2 WHERE id = $3`,
      [deleted_at, deleted_by, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (delete employee):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/profiles - Fetch all profiles (including pending)
router.get('/all/profiles', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM profiles ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error("DB Error (get profiles):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/profiles/:id - Update profile
router.put('/all/profiles/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const keys = Object.keys(updates);
    if (keys.length === 0) return res.json({ success: true });
    
    const setClause = keys.map((key, i) => `"${key}" = $${i + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    
    await db.query(`UPDATE profiles SET ${setClause} WHERE id = $1`, values);
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (update profile):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
