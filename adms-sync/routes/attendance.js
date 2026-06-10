const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// --- API ROUTE: Get Attendance ---
router.get('/', requireAuth, async (req, res) => {
  try {
    const { start, end } = req.query;
    let query = 'SELECT * FROM attendance_logs WHERE is_deleted IS NOT TRUE';
    let params = [];
    
    if (start && end) {
      query += ' AND date >= $1 AND date <= $2';
      params.push(start, end);
    }
    
    query += ' ORDER BY date DESC';
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- API ROUTE: Manual Time ---
router.put('/manual-time', requireAuth, async (req, res) => {
  try {
    const { employee_id, date, check_in, check_out } = req.body;
    const marked_by = req.user.sub;
    
    const { rows: existing } = await db.query('SELECT id FROM attendance_logs WHERE employee_id = $1 AND date = $2', [employee_id, date]);
    
    if (existing.length > 0) {
      await db.query(
        'UPDATE attendance_logs SET check_in = $1, check_out = $2, is_manual = true, status = $3, marked_by = $4 WHERE employee_id = $5 AND date = $6',
        [check_in, check_out || null, 'present', marked_by, employee_id, date]
      );
    } else {
      await db.query(
        'INSERT INTO attendance_logs (employee_id, date, check_in, check_out, is_manual, status, marked_by) VALUES ($1, $2, $3, $4, true, $5, $6)',
        [employee_id, date, check_in, check_out || null, 'present', marked_by]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (manual-time):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- API ROUTE: Mark OD ---
router.put('/mark-od', requireAuth, async (req, res) => {
  try {
    const { employee_id, date, od_reason, check_in } = req.body;
    const marked_by = req.user.sub;
    
    const { rows: existing } = await db.query('SELECT id FROM attendance_logs WHERE employee_id = $1 AND date = $2', [employee_id, date]);
    
    if (existing.length > 0) {
      await db.query(
        `UPDATE attendance_logs SET status = 'OD', is_manual = true, check_in = $1, od_reason = $2, marked_by = $3 WHERE employee_id = $4 AND date = $5`,
        [check_in, od_reason || 'Field Trip (OD)', marked_by, employee_id, date]
      );
    } else {
      await db.query(
        `INSERT INTO attendance_logs (employee_id, date, check_in, status, is_manual, od_reason, marked_by) VALUES ($1, $2, $3, 'OD', true, $4, $5)`,
        [employee_id, date, check_in, od_reason || 'Field Trip (OD)', marked_by]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (mark-od):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
