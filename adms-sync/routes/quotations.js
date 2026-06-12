const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// GET /api/quotations/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*, customers(name, address, phone)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Supabase Error (get quotation):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/quotations/:id/items
router.get('/:id/items', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', req.params.id)
      .order('created_at');

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Supabase Error (get quotation items):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/quotations
router.post('/', requireAuth, async (req, res) => {
  try {
    const { quotation, items } = req.body;
    
    // Create quotation
    const { data: qData, error: qErr } = await supabase
      .from('quotations')
      .insert([quotation])
      .select()
      .single();

    if (qErr) throw qErr;

    // Attach items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({ ...item, quotation_id: qData.id }));
      const { error: itemsErr } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert);

      if (itemsErr) throw itemsErr;
    }

    res.status(201).json(qData);
  } catch (err) {
    console.error("Supabase Error (create quotation):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/quotations/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { quotation, itemsToUpdate, itemsToInsert } = req.body;

    // Update quotation
    if (quotation && Object.keys(quotation).length > 0) {
      const { error: qErr } = await supabase
        .from('quotations')
        .update(quotation)
        .eq('id', req.params.id);
      if (qErr) throw qErr;
    }

    // Update items
    if (itemsToUpdate && itemsToUpdate.length > 0) {
      for (const item of itemsToUpdate) {
        await supabase.from('quotation_items').update(item).eq('id', item.id);
      }
    }

    // Insert new items
    if (itemsToInsert && itemsToInsert.length > 0) {
      const { error: insErr } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert.map(item => ({ ...item, quotation_id: req.params.id })));
      if (insErr) throw insErr;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (update quotation):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
