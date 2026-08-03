const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/shipments/events
router.get('/events', requireAuth, async (req, res) => {
  try {
    const { shipment_id } = req.query;
    if (!shipment_id) return res.status(400).json({ error: 'shipment_id is required' });

    const query = `
      SELECT * FROM shipment_events 
      WHERE shipment_id = $1 
      ORDER BY created_at DESC
    `;
    const { rows } = await db.query(query, [shipment_id]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching shipment events:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/shipments/events
router.post('/events', requireAuth, async (req, res) => {
  try {
    const { shipment_id, event_type, title, description, location, date } = req.body;
    
    // Attempt to get user profile name
    const { rows: userRow } = await db.query(
      'SELECT full_name, company_id FROM profiles WHERE id = $1 LIMIT 1',
      [req.user.sub]
    );
    const created_by_name = userRow.length > 0 ? userRow[0].full_name : null;
    const company_id = userRow.length > 0 ? userRow[0].company_id : null;

    const query = `
      INSERT INTO shipment_events (
        shipment_id, company_id, event_type, title, description, location, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    const values = [shipment_id, company_id, event_type, title, description, location, req.user.sub];
    
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating shipment event:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
