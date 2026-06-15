const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// GET /api/user-permissions - fetch permissions (all users or specific user)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { user_id } = req.query;

    if (user_id) {
      // Fetch permissions for a specific user
      console.log(`[API /user-permissions] Fetching for single user: ${user_id}`);
      const { rows: perms } = await db.query(
        'SELECT section, has_access FROM user_permissions WHERE user_id = $1',
        [user_id]
      );
      return res.json(perms || []);
    }

    // Otherwise, fetch all users and their permissions (Admin Matrix View)
    // 1. Fetch users from 'profiles' using pg; fall back to Supabase if missing
    let profiles = [];
    try {
      const { rows } = await db.query('SELECT id, full_name, email, role FROM profiles');
      profiles = rows || [];
    } catch (err) {
      console.warn('[API /user-permissions] profiles table not available in local DB, falling back to Supabase:', err.message);
      const { data: supaProfiles, error: supaErr } = await supabase.from('profiles').select('id, full_name, email, role');
      if (supaErr) throw supaErr;
      profiles = supaProfiles || [];
    }

    // 2. Fetch all user permissions using pg; fall back to Supabase if missing
    let perms = [];
    try {
      const { rows } = await db.query('SELECT * FROM user_permissions');
      perms = rows || [];
    } catch (err) {
      console.warn('[API /user-permissions] user_permissions table not available in local DB, falling back to Supabase:', err.message);
      const { data: supaPerms, error: supaErr } = await supabase.from('user_permissions').select('*');
      if (supaErr) throw supaErr;
      perms = supaPerms || [];
    }
    // 3. Map permissions to users
    const mapped = profiles.map(p => {
       const userPerms = perms
         .filter(up => String(up.user_id) === String(p.id))
         .map(up => ({
            section: up.section,
            has_access: up.has_access
         }));
       return {
         ...p,
         permissions: userPerms
       };
    });
    
    // Sort by full_name
    mapped.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    console.log(`[API /user-permissions] Sent ${mapped.length} users to frontend.`);
    res.json(mapped);
  } catch (err) {
    console.error('Permissions GET error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/user-permissions/:user_id - fetch permissions for a specific user via URL param
router.get('/:user_id', requireAuth, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    console.log(`[API /user-permissions/:user_id] Fetching for single user: ${user_id}`);
    const { rows: perms } = await db.query(
      'SELECT section, has_access FROM user_permissions WHERE user_id = $1',
      [user_id]
    );
    return res.json(perms || []);
  } catch (err) {
    console.error('Permissions GET single error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/user-permissions - save/update a permission checkbox
router.post('/', requireAuth, async (req, res) => {
  try {
    const { user_id, section, has_access } = req.body;
    if (!user_id || !section || typeof has_access !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid body parameters' });
    }

    // Upsert logic using PostgreSQL
    const { rows: existing } = await db.query(
      'SELECT id FROM user_permissions WHERE user_id = $1 AND section = $2',
      [user_id, section]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE user_permissions SET has_access = $1, updated_at = NOW() WHERE id = $2',
        [has_access, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO user_permissions (user_id, section, has_access) VALUES ($1, $2, $3)',
        [user_id, section, has_access]
      );
    }

    // Mirror change to Supabase so realtime subscribers pick it up
    try {
      const upsertPayload = { user_id, section, has_access, granted_by: req.user?.sub || null };
      const { data: supaData, error: supaErr } = await supabase
        .from('user_permissions')
        .upsert(upsertPayload, { onConflict: 'user_id,section' });
      if (supaErr) console.warn('[API /user-permissions] Supabase upsert warning:', supaErr.message);
    } catch (sErr) {
      console.warn('[API /user-permissions] Failed to mirror permission to Supabase:', sErr.message || sErr);
    }
    console.log(`[API /user-permissions] Saved permission for user ${user_id}, section ${section}: ${has_access}`);
    return res.json({ success: true, message: 'Permission updated' });
  } catch (err) {
    console.error('Permissions POST error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal Server Error' });
  }
});

module.exports = router;
