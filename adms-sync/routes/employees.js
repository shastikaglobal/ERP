const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

// Supabase admin client — profiles, roles, user_roles live here
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/employees - Fetch all approved employees from Supabase
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, requested_role, status, is_active, avatar_url, biometric_id, dob, joining_date, system_mode, city, monthly_salary, punch_deadline, department')
      .eq('status', 'approved')
      .eq('is_deleted', false)
      .order('full_name');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('GET /api/employees error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/employees/all/profiles - Fetch ALL profiles (for approvals page)
router.get('/all/profiles', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, requested_role, status, rejection_reason, created_at, department, is_active, biometric_id, monthly_salary, joining_date')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('GET /api/employees/all/profiles error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/employees/:id - Fetch single employee
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    console.error('GET /api/employees/:id error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/employees - Add new employee
router.post('/', requireAuth, async (req, res) => {
  try {
    const { id, full_name, email, requested_role } = req.body;
    const { error } = await supabase
      .from('profiles')
      .insert({ id, full_name, email, requested_role, status: 'approved' });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/employees error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/employees/:id - Update employee profile fields
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (Object.keys(updates).length === 0) return res.json({ success: true });

    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/employees/:id error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/employees/:id - Soft delete employee
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.user.sub;
    const deleted_at = new Date().toISOString();
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false, is_deleted: true, deleted_at, deleted_by })
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/employees/:id error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/employees/all/profiles/:id - Approve/reject/change-role
// Enforces ONE ROLE PER PERSON: removes all existing user_roles before assigning the new one
router.put('/all/profiles/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, requested_role, rejection_reason, ...otherUpdates } = req.body;

    // Build profile update payload
    const profileUpdate = { ...otherUpdates };
    if (status) profileUpdate.status = status;
    if (requested_role) profileUpdate.requested_role = requested_role;
    if (status === 'approved') {
      profileUpdate.approved_by = req.user?.sub || null;
      profileUpdate.approved_at = new Date().toISOString();
      profileUpdate.rejection_reason = null;
    }
    if (status === 'rejected') {
      profileUpdate.rejection_reason = rejection_reason || null;
      profileUpdate.approved_by = null;
      profileUpdate.approved_at = null;
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', id);
      if (profileErr) throw profileErr;
    }

    // Assign role — ONE ROLE PER PERSON
    if (requested_role && (status === 'approved' || !status)) {
      const { data: roleRow, error: roleErr } = await supabase
        .from('roles')
        .select('id')
        .eq('slug', requested_role)
        .maybeSingle();
      if (roleErr) throw roleErr;

      if (roleRow?.id) {
        // Remove ALL existing roles for this user (enforces one role per person)
        await supabase.from('user_roles').delete().eq('user_id', id);
        // Insert single new role
        const { error: insertErr } = await supabase
          .from('user_roles')
          .insert({ user_id: id, role_id: roleRow.id, assigned_at: new Date().toISOString() });
        if (insertErr) throw insertErr;
        console.log(`[ROLE SYNC] User ${id} assigned role '${requested_role}' (one-role enforced)`);
      } else {
        console.warn(`[ROLE SYNC] Role slug '${requested_role}' not found in Supabase roles table`);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/employees/all/profiles/:id error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
