const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/farmers
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM farmers WHERE is_deleted IS NOT TRUE ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('DB Error (get farmers):', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// POST /api/farmers
router.post('/', requireAuth, async (req, res) => {
  try {
    const { company_id, full_name, email, phone, country, district, primary_crops, is_active } = req.body;
    
    if (!company_id || !full_name) {
      return res.status(400).json({ error: 'company_id and full_name are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO farmers (company_id, full_name, email, phone, country, district, primary_crops, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [company_id, full_name, email, phone, country, district, primary_crops, is_active ?? true]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('DB Error (create farmer):', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// DELETE /api/farmers/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE farmers SET is_deleted = true, is_active = false, deleted_at = NOW(), deleted_by = $1 WHERE id = $2 RETURNING id`,
      [req.user?.id || null, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('DB Error (delete farmer):', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// POST /api/farmers/:id/convert - Convert a farmer record into a customer
router.post('/:id/convert', requireAuth, async (req, res) => {
  const farmerId = req.params.id;
  const { company_id, name, email, country, phone, notes } = req.body;

  if (!company_id) {
    return res.status(400).json({ error: 'company_id is required' });
  }

  try {
    const { rows: farmerRows } = await db.query(
      `SELECT id, full_name, email, phone, country, notes, is_deleted FROM farmers WHERE id = $1`,
      [farmerId]
    );

    if (farmerRows.length === 0 || farmerRows[0].is_deleted) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    const farmer = farmerRows[0];
    const customerEmail = (email || farmer.email || '').trim();

    if (customerEmail) {
      const { rows: existingCustomers } = await db.query(
        `SELECT id FROM customers WHERE company_id = $1 AND email = $2 LIMIT 1`,
        [company_id, customerEmail]
      );

      if (existingCustomers.length > 0) {
        return res.status(409).json({ error: 'A customer with this email already exists for the selected company.' });
      }
    }

    const { rows: insertedRows } = await db.query(
      `INSERT INTO customers (company_id, name, email, country, phone, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        company_id,
        name || farmer.full_name,
        customerEmail || null,
        country || farmer.country || null,
        phone || farmer.phone || null,
        notes || farmer.notes || null,
      ]
    );

    return res.status(201).json(insertedRows[0]);
  } catch (err) {
    console.error('DB Error (convert farmer):', err);
    return res.status(500).json({ error: err.message || 'Failed to convert farmer to customer' });
  }
});

module.exports = router;
