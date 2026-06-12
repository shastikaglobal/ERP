const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// GET /api/leads - Fetch all leads
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Supabase Error (get leads):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/:id - Fetch single lead
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (err) {
    console.error("Supabase Error (get single lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads - Create lead
router.post('/', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    data.created_by = req.user.sub || req.user.id;

    // Fetch user's company_id from profiles if not provided
    if (!data.company_id && data.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', data.created_by)
        .single();

      if (profile) {
        data.company_id = profile.company_id;
      }
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(lead);
  } catch (err) {
    console.error("Supabase Error (create lead):", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    if (Object.keys(updates).length === 0) return res.json({ success: true });

    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (update lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/leads/:id - Delete lead (Soft delete)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (delete lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/meta/sources - Fetch acquisition channels
router.get('/meta/sources', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('acquisition_channels')
      .select('id, channel_name')
      .order('channel_name');

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Supabase Error (get sources):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/:id/convert - Convert lead to customer
router.post('/:id/convert', requireAuth, async (req, res) => {
  try {
    const { company_id, name, country, email } = req.body;

    // Insert into customers
    const { error: custErr } = await supabase
      .from('customers')
      .insert([{ company_id, name, country, email }]);

    if (custErr) throw custErr;

    // Update lead stage
    const { error: leadErr } = await supabase
      .from('leads')
      .update({ stage: 'Won' })
      .eq('id', req.params.id);

    if (leadErr) throw leadErr;

    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (convert lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/:id/follow-ups - Add follow up and update assignee
router.post('/:id/follow-ups', requireAuth, async (req, res) => {
  try {
    const { company_name, contact_name, follow_up_date, note, assigned_to } = req.body;

    const { error: followErr } = await supabase
      .from('follow_ups')
      .insert([{
        lead_id: req.params.id,
        company_name,
        contact_name,
        follow_up_date,
        note,
        assigned_to,
        is_notified: false
      }]);

    if (followErr) throw followErr;

    const { error: leadErr } = await supabase
      .from('leads')
      .update({ assigned_to })
      .eq('id', req.params.id);

    if (leadErr) throw leadErr;

    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (add follow-up):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/:id/follow-ups - Fetch lead follow ups
router.get('/:id/follow-ups', requireAuth, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('lead_id', req.params.id)
      .neq('is_deleted', true)
      .order('follow_up_date', { ascending: false });

    if (error) throw error;
    res.json(rows || []);
  } catch (err) {
    console.error("Supabase Error (get lead follow-ups):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/:id/activities - Fetch lead activities
router.get('/:id/activities', requireAuth, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('activities')
      .select('*, profiles(full_name)')
      .eq('lead_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(rows || []);
  } catch (err) {
    console.error("Supabase Error (get lead activities):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/:id/quotations - Fetch lead quotations
router.get('/:id/quotations', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('id, quotation_number, status, created_at, amount, currency')
      .eq('lead_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Supabase Error (get lead quotations):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/:id/activities - Add activity
router.post('/:id/activities', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    data.lead_id = req.params.id;
    data.created_by = req.user.sub || req.user.id;

    const { data: activity, error } = await supabase
      .from('lead_activities')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(activity);
  } catch (err) {
    console.error("Supabase Error (create lead activity):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
