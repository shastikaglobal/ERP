const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// GET /api/follow-ups
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*')
      .neq('is_deleted', true)
      .order('follow_up_date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Supabase Error (get follow-ups):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/follow-ups/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    if (Object.keys(updates).length === 0) return res.json({ success: true });

    const { error } = await supabase
      .from('follow_ups')
      .update(updates)
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (update follow-up):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/follow-ups/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('follow_ups')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (delete follow-up):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
