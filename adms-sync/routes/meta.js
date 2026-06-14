const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/meta/container_types
router.get('/container_types', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT name FROM container_types ORDER BY name');
    res.json(rows.map(r => ({ name: r.name })));
  } catch (err) {
    console.error('DB Error (container_types):', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/meta/packaging_types
router.get('/packaging_types', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT name FROM packaging_types ORDER BY name');
    res.json(rows.map(r => ({ name: r.name })));
  } catch (err) {
    console.error('DB Error (packaging_types):', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/meta/sidebar-counts
router.get('/sidebar-counts', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;

    // 1. Client Acquisition: leads with stage 'Client Successfully Acquired'
    let acqQuery = `SELECT COUNT(*) FROM leads WHERE is_deleted = false AND stage = 'Client Successfully Acquired'`;
    const acqParams = [];
    if (company_id) {
      acqQuery += ` AND company_id = $1`;
      acqParams.push(company_id);
    }
    const acqRes = await db.query(acqQuery, acqParams);

    // 2. Client Success (Conversions): leads with stage 'Won'
    let convQuery = `SELECT COUNT(*) FROM leads WHERE is_deleted = false AND stage = 'Won'`;
    const convParams = [];
    if (company_id) {
      convQuery += ` AND company_id = $1`;
      convParams.push(company_id);
    }
    const convRes = await db.query(convQuery, convParams);

    // 3. Total Customers
    let custQuery = `SELECT COUNT(*) FROM customers WHERE 1=1`;
    const custParams = [];
    if (company_id) {
      custQuery = `SELECT COUNT(*) FROM customers WHERE company_id = $1`;
      custParams.push(company_id);
    }
    const custRes = await db.query(custQuery, custParams);

    res.json({
      clientAcq: parseInt(acqRes.rows[0].count, 10),
      conversions: parseInt(convRes.rows[0].count, 10),
      customers: parseInt(custRes.rows[0].count, 10)
    });
  } catch (err) {
    console.error('DB Error (sidebar-counts):', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
