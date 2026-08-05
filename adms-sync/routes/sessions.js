const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /api/sessions/start
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { user_id, email } = req.body;
    if (!user_id || !email) {
      return res.status(400).json({ error: 'user_id and email are required' });
    }

    // Check if there is already an active session (logout_time IS NULL)
    const existingCheck = await db.query(
      `SELECT id FROM user_sessions WHERE user_id = $1 AND logout_time IS NULL LIMIT 1`,
      [user_id]
    );

    if (existingCheck.rows.length > 0) {
      const existingId = existingCheck.rows[0].id;
      // Update login_time to now
      await db.query(`UPDATE user_sessions SET login_time = NOW() WHERE id = \$1`, [existingId, req.user?.sub || req.user?.id]);
      return res.json({ id: existingId });
    }

    // Insert new session
    const { rows } = await db.query(
      `INSERT INTO user_sessions (user_id, email, login_time) VALUES ($1, $2, NOW()) RETURNING id`,
      [user_id, email]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('DB Error (sessions/start):', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sessions/ping
router.put('/ping', requireAuth, async (req, res) => {
  try {
    const { user_id, is_idle } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    // Fetch current session stats
    const currentRes = await db.query(
      `SELECT id, active_minutes, idle_minutes FROM user_sessions WHERE user_id = $1 AND logout_time IS NULL ORDER BY login_time DESC LIMIT 1`,
      [user_id]
    );

    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'No active session found' });
    }

    const current = currentRes.rows[0];
    const newActive = is_idle ? (current.active_minutes || 0) : (current.active_minutes || 0) + 1;
    const newIdle = is_idle ? (current.idle_minutes || 0) + 1 : (current.idle_minutes || 0);

    let query = `UPDATE user_sessions SET active_minutes = $1, idle_minutes = $2`;
    const params = [newActive, newIdle, current.id];

    if (!is_idle) {
      query += `, last_activity = NOW()`;
    }
    
    query += ` WHERE id = $3 RETURNING active_minutes, idle_minutes`;

    const { rows } = await db.query(query, params);
    res.json(rows[0]);
  } catch (err) {
    console.error('DB Error (sessions/ping):', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/end
router.post('/end', requireAuth, async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    // Mark active sessions as soft deleted
    await db.query(
      `UPDATE active_sessions SET is_deleted = true, deleted_at = NOW(), deleted_by = $1 WHERE user_id = $1`,
      [user_id]
    );

    // Fetch open user_sessions
    const loginRes = await db.query(
      `SELECT id, login_time FROM user_sessions WHERE user_id = $1 AND logout_time IS NULL ORDER BY login_time DESC LIMIT 1`,
      [user_id]
    );

    if (loginRes.rows.length > 0) {
      const record = loginRes.rows[0];
      const loginTime = new Date(record.login_time);
      const logoutTime = new Date();
      const durationMinutes = Math.round((logoutTime.getTime() - loginTime.getTime()) / 60000);

      await db.query(
        `UPDATE user_sessions SET logout_time = NOW(), duration_minutes = $1 WHERE id = $2`,
        [durationMinutes, record.id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('DB Error (sessions/end):', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
