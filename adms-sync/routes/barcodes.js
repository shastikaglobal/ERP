const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Get all barcodes
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT b.id, b.code, b.level, b.box_number, b.current_location, b.status, b.scan_count, b.last_scanned_at, b.created_at,
             ib.lot_number, ib.grade, p.name as product_name, f.full_name as farmer_name,
             es.id as shipment_id, es.shipment_number, es.destination_port, es.status as shipment_status,
             eo.id as order_id, eo.order_number, eo.destination, eo.status as order_status
      FROM batch_barcodes b
      LEFT JOIN inventory_batches ib ON b.batch_id = ib.id
      LEFT JOIN products p ON ib.product_id = p.id
      LEFT JOIN farmers f ON ib.farmer_id = f.id
      LEFT JOIN export_shipments es ON b.shipment_id = es.id
      LEFT JOIN export_orders eo ON b.order_id = eo.id
      ORDER BY b.created_at DESC
    `);
    
    // Transform flat result to nested objects expected by UI
    const mappedData = result.rows.map(r => ({
      id: r.id, code: r.code, level: r.level, box_number: r.box_number, 
      current_location: r.current_location, status: r.status, 
      scan_count: r.scan_count, last_scanned_at: r.last_scanned_at, created_at: r.created_at,
      batch: r.lot_number ? { lot_number: r.lot_number, grade: r.grade, product: { name: r.product_name }, farmer: { full_name: r.farmer_name } } : null,
      shipment: r.shipment_id ? { id: r.shipment_id, shipment_number: r.shipment_number, destination_port: r.destination_port, status: r.shipment_status } : null,
      order: r.order_id ? { id: r.order_id, order_number: r.order_number, destination: r.destination, status: r.order_status } : null
    }));
    
    res.json({ data: mappedData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single barcode by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM batch_barcodes WHERE id = $1`, [req.params.id]);
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
