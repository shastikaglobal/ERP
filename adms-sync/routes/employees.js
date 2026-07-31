const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const VALID_PROFILE_COLUMNS = new Set([
  'id', 'company_id', 'is_active', 'created_at', 'updated_at', 'status',
  'approved_by', 'approved_at', 'monthly_salary', 'punch_deadline',
  'monthly_target', 'dob', 'joining_date', 'is_deleted', 'deleted_at',
  'deleted_by', 'full_name', 'email', 'avatar_url', 'phone',
  'employee_id', 'role', 'department', 'zoho_meeting_link',
  'requested_role', 'system_mode', 'city', 'rejection_reason',
  'email_signature', 'biometric_id'
]);

async function syncProfileToLocalDb(id, updates) {
  try {
    const keys = Object.keys(updates).filter(k => VALID_PROFILE_COLUMNS.has(k));
    if (keys.length === 0) return;

    const setClauses = keys.map((key, index) => `"${key}" = $${index + 1}`);
    const values = keys.map(key => updates[key]);
    
    const queryText = `
      UPDATE profiles 
      SET ${setClauses.join(', ')}, updated_at = NOW() 
      WHERE id = $${keys.length + 1}
      RETURNING id
    `;
    
    const { rowCount } = await db.query(queryText, [...values, id]);
    
    if (rowCount === 0) {
      console.log(`[Sync] Profile ${id} not found locally during update. Fetching from Supabase to sync...`);
      const { data: sbProfile, error: sbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!sbError && sbProfile) {
        await db.query(
          `INSERT INTO profiles (
            id, company_id, full_name, email, avatar_url, phone, employee_id, role, department, 
            zoho_meeting_link, requested_role, system_mode, city, status, rejection_reason, 
            email_signature, biometric_id, is_active, is_deleted, created_at, updated_at,
            approved_by, approved_at, monthly_salary, punch_deadline, monthly_target
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
            $22, $23, $24, $25, $26
          ) ON CONFLICT (id) DO UPDATE SET
            company_id = EXCLUDED.company_id,
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role,
            department = EXCLUDED.department,
            is_active = EXCLUDED.is_active,
            is_deleted = EXCLUDED.is_deleted,
            updated_at = NOW()`,
          [
            sbProfile.id,
            sbProfile.company_id || null,
            sbProfile.full_name || null,
            sbProfile.email || null,
            sbProfile.avatar_url || null,
            sbProfile.phone || null,
            sbProfile.employee_id || null,
            sbProfile.role || null,
            sbProfile.department || null,
            sbProfile.zoho_meeting_link || null,
            sbProfile.requested_role || null,
            sbProfile.system_mode || null,
            sbProfile.city || null,
            sbProfile.status || 'pending',
            sbProfile.rejection_reason || null,
            sbProfile.email_signature || null,
            sbProfile.biometric_id || null,
            sbProfile.is_active ?? true,
            sbProfile.is_deleted ?? false,
            sbProfile.created_at || new Date().toISOString(),
            sbProfile.updated_at || new Date().toISOString(),
            sbProfile.approved_by || null,
            sbProfile.approved_at || null,
            sbProfile.monthly_salary || null,
            sbProfile.punch_deadline || null,
            sbProfile.monthly_target || null
          ]
        );
        console.log(`[Sync] Successfully created profile for ${id} in local VPS DB`);
      }
    } else {
      console.log(`[Sync] Successfully synced updates to local VPS DB for profile ${id}`);
    }
  } catch (err) {
    console.error(`[Sync] Failed to sync profile update for ${id} to VPS DB:`, err.message);
  }
}


// GET /api/employees - Fetch all approved employees from local DB/Supabase
router.get('/', requireAuth, async (req, res) => {
  try {
    try {
      const { rows } = await db.query(`
        SELECT id, company_id, full_name, email, phone, requested_role, status, is_active, 
               avatar_url, biometric_id, dob, joining_date, system_mode, city, 
               monthly_salary, punch_deadline, department 
        FROM profiles 
        WHERE status = 'approved' AND (is_deleted IS NOT TRUE)
        ORDER BY full_name
      `);
      return res.json(rows);
    } catch (dbErr) {
      console.warn('[API /employees] Local query failed, trying Supabase:', dbErr.message);
    }

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

// GET /api/employees/all/profiles - Fetch ALL profiles from local DB/Supabase
router.get('/all/profiles', requireAuth, async (req, res) => {
  try {
    try {
      const { rows } = await db.query(`
        SELECT id, company_id, full_name, email, phone, role, requested_role, status, rejection_reason, 
               created_at, department, is_active, biometric_id, monthly_salary, joining_date 
        FROM profiles 
        WHERE is_deleted IS NOT TRUE 
        ORDER BY created_at DESC
      `);
      return res.json(rows);
    } catch (dbErr) {
      console.warn('[API /employees/all/profiles] Local query failed, trying Supabase:', dbErr.message);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, requested_role, status, rejection_reason, created_at, department, is_active, biometric_id, monthly_salary, joining_date')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('GET /api/employees/all/profiles error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/employees/lookup-id/:id - Resolve employee ID or biometric ID to email
router.get('/lookup-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Lookup ID] Checking local database for ID: ${id}`);
    
    const { rows } = await db.query(
      `SELECT email, full_name, role FROM profiles WHERE (employee_id = $1 OR biometric_id = $2) AND is_deleted IS NOT TRUE LIMIT 1`,
      [id, id]
    );

    if (rows.length > 0) {
      console.log(`[Lookup ID] Found locally: ${rows[0].email} (${rows[0].full_name})`);
      return res.json({ email: rows[0].email, full_name: rows[0].full_name, role: rows[0].role });
    }

    console.log(`[Lookup ID] Not found locally, checking Supabase...`);
    const { data, error } = await supabase
      .from('profiles')
      .select('email, full_name, role')
      .or(`employee_id.eq.${id},biometric_id.eq.${id}`)
      .maybeSingle();

    if (error) {
      console.error(`[Lookup ID] Supabase fallback error:`, error.message);
    }

    if (data && data.email) {
      return res.json({ email: data.email, full_name: data.full_name, role: data.role });
    }

    return res.status(404).json({ error: 'Employee ID not found' });
  } catch (err) {
    console.error('GET /api/employees/lookup-id/:id error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/employees/:id/roles-permissions - Fetch role slugs and permission codes from local DB
router.get('/:id/roles-permissions', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Roles/Perms] Checking local database for user: ${id}`);
    
    // 1. Get roles
    const { rows: roles } = await db.query(
      `SELECT r.slug 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND ur.is_deleted IS NOT TRUE`,
      [id]
    );

    // 2. Get permissions
    const { rows: perms } = await db.query(
      `SELECT p.code 
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1 AND ur.is_deleted IS NOT TRUE`,
      [id]
    );

    // 3. Fallback: if user is not in user_roles, but has a role in profiles table, use that
    const roleSlugs = roles.map(r => r.slug);
    if (roleSlugs.length === 0) {
      const { rows: profile } = await db.query(
        `SELECT role FROM profiles WHERE id = $1 LIMIT 1`,
        [id]
      );
      if (profile.length > 0 && profile[0].role) {
        roleSlugs.push(profile[0].role);
      }
    }

    res.json({
      roleSlugs,
      permissions: perms.map(p => p.code)
    });
  } catch (err) {
    console.error('GET /api/employees/:id/roles-permissions error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/employees/:id - Fetch single employee
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try local database first
    const { rows } = await db.query('SELECT * FROM profiles WHERE id = $1 LIMIT 1', [id]);
    if (rows.length > 0) {
      return res.json(rows[0]);
    }

    // Fallback: check Supabase
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

// POST /api/employees/register - Public signup route to bypass email verification constraints
router.post('/register', async (req, res) => {
  try {
    const { employeeId, email, password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    let signUpEmail = email;
    let empId = null;
    
    if (employeeId) {
      empId = employeeId.trim();
      const host = req.headers.host || 'local.erp';
      const hostname = host.split(':')[0];
      const domain = hostname === 'localhost' || hostname === '127.0.0.1' ? 'local.erp' : hostname;
      signUpEmail = `${empId}@${domain}`;
    } else if (email) {
      signUpEmail = email.trim();
    } else {
      return res.status(400).json({ error: 'Employee ID or Email is required' });
    }
    
    // Check if biometric_id/employee_id is already registered
    if (empId) {
      const { data: existingId, error: checkError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .or(`employee_id.eq.${empId},biometric_id.eq.${empId}`)
        .maybeSingle();
        
      if (checkError) throw checkError;
      if (existingId) {
        return res.status(400).json({ error: `Employee ID "${empId}" is already registered.` });
      }
    } else {
      const { data: existingEmail, error: checkError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', signUpEmail)
        .maybeSingle();
        
      if (checkError) throw checkError;
      if (existingEmail) {
        return res.status(400).json({ error: `Email "${signUpEmail}" is already registered.` });
      }
    }
    
    console.log(`[Signup API] Creating auth user for email ${signUpEmail}...`);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: signUpEmail,
      password: password,
      email_confirm: true,
      user_metadata: empId ? {
        employee_id: empId,
        biometric_id: empId
      } : {}
    });
    
    if (error) {
      console.error('[Signup API] Supabase error:', error.message);
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ success: true, email: signUpEmail });
  } catch (err) {
    console.error('[Signup API] Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// POST /api/employees - Add new employee
router.post('/', requireAuth, async (req, res) => {
  try {
    const { id, full_name, email, requested_role } = req.body;
    
    // Insert locally first
    try {
      await db.query(
        `INSERT INTO profiles (id, full_name, email, requested_role, status) 
         VALUES ($1, $2, $3, $4, 'approved') 
         ON CONFLICT (id) DO NOTHING`,
        [id, full_name, email, requested_role]
      );
      console.log(`[Sync] Profile ${id} inserted locally`);
    } catch (localErr) {
      console.error('[Sync] Local profile insert failed:', localErr.message);
      throw localErr;
    }

    // Try Supabase
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({ id, full_name, email, requested_role, status: 'approved' });
      if (error) throw error;
    } catch (supaErr) {
      console.warn('[Sync] Supabase profile insert failed/ignored:', supaErr.message);
    }

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

    // 1. Update local VPS database first since it is the active source of truth!
    try {
      await syncProfileToLocalDb(id, updates);
      console.log(`[Sync] Profile ${id} successfully updated in local DB`);
    } catch (dbErr) {
      console.error(`[Sync] Local DB profile update failed:`, dbErr.message);
      throw dbErr;
    }

    // 2. Try to update Supabase in the background (non-blocking)
    supabase.from('profiles').update(updates).eq('id', id)
      .then(({ error }) => {
        if (error) console.warn(`[Sync] Supabase profile update failed/ignored (restricted quota):`, error.message);
      })
      .catch(supabaseErr => {
        console.warn(`[Sync] Supabase profile update exception:`, supabaseErr.message);
      });

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

    // 1. Soft-delete locally first
    try {
      await db.query(
        `UPDATE profiles 
         SET is_active = false, is_deleted = true, deleted_at = $1, deleted_by = $2 
         WHERE id = $3`,
        [deleted_at, deleted_by, id]
      );
      console.log(`[Sync] Profile ${id} soft-deleted locally`);
    } catch (localErr) {
      console.error('[Sync] Local profile soft-delete failed:', localErr.message);
      throw localErr;
    }

    // 2. Try Supabase
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false, is_deleted: true, deleted_at, deleted_by })
        .eq('id', id);
      if (error) throw error;
    } catch (supaErr) {
      console.warn('[Sync] Supabase profile soft-delete failed/ignored:', supaErr.message);
    }

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
    if (requested_role) {
      profileUpdate.requested_role = requested_role;
      profileUpdate.role = requested_role; // Synchronize active role field!
    }
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

    // 1. Update profiles table locally first
    if (Object.keys(profileUpdate).length > 0) {
      try {
        await syncProfileToLocalDb(id, profileUpdate);
        console.log(`[Sync] Profile ${id} successfully updated in local DB`);
      } catch (dbErr) {
        console.error(`[Sync] Local DB profile update failed:`, dbErr.message);
        throw dbErr;
      }

      // Try Supabase update in background (non-blocking)
      supabase.from('profiles').update(profileUpdate).eq('id', id)
        .then(({ error: profileErr }) => {
          if (profileErr) console.warn(`[Sync] Supabase profile update failed/ignored (restricted quota):`, profileErr.message);
        })
        .catch(supaErr => {
          console.warn(`[Sync] Supabase profile update exception:`, supaErr.message);
        });
    }

    // 2. Assign role locally first
    if (requested_role && (status === 'approved' || !status)) {
      // Find role ID locally from the local database
      let roleId = null;
      try {
        const { rows: localRoles } = await db.query(
          `SELECT id FROM roles WHERE slug = $1 LIMIT 1`,
          [requested_role]
        );
        if (localRoles.length > 0) {
          roleId = localRoles[0].id;
        }
      } catch (localRoleErr) {
        console.error(`[Sync] Local role search failed for slug '${requested_role}':`, localRoleErr.message);
      }

      if (roleId) {
        // Update user_roles in local database (upsert conflict handles it gracefully!)
        try {
          await db.query(`
            INSERT INTO user_roles (user_id, role_id) 
            VALUES ($1, $2) 
            ON CONFLICT (user_id) 
            DO UPDATE SET role_id = EXCLUDED.role_id, is_deleted = false, deleted_at = NULL, deleted_by = NULL
          `, [id, roleId]);
          console.log(`[ROLE SYNC] User ${id} assigned role '${requested_role}' in local DB`);
        } catch (localUrErr) {
          console.error(`[Sync] Local user_roles insertion failed:`, localUrErr.message);
          throw localUrErr;
        }

        // Try Supabase role sync in background (non-blocking)
        supabase.from('roles').select('id').eq('slug', requested_role).maybeSingle()
          .then(async ({ data: roleRow, error: roleErr }) => {
            if (!roleErr && roleRow?.id) {
              // Remove ALL existing roles for this user in Supabase
              await supabase.from('user_roles').delete().eq('user_id', id);
              // Insert single new role in Supabase
              await supabase
                .from('user_roles')
                .insert({ user_id: id, role_id: roleRow.id, assigned_at: new Date().toISOString() });
              console.log(`[ROLE SYNC] User ${id} assigned role '${requested_role}' in Supabase`);
            }
          })
          .catch(supaRoleErr => {
            console.warn(`[Sync] Supabase role sync exception:`, supaRoleErr.message);
          });
      } else {
        console.warn(`[ROLE SYNC] Role slug '${requested_role}' not found in local roles table`);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/employees/all/profiles/:id error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/employees/bio-data - Save face embedding to VPS DB
router.post('/bio-data', requireAuth, async (req, res) => {
  try {
    const { employee_id, face_embedding, sample_index, quality_score, model_version } = req.body;
    const { rows } = await db.query(
      `INSERT INTO face_embeddings (employee_id, face_embedding, sample_index, quality_score, model_version) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (employee_id, sample_index) 
       DO UPDATE SET face_embedding = EXCLUDED.face_embedding, quality_score = EXCLUDED.quality_score, model_version = EXCLUDED.model_version
       RETURNING *`,
      [employee_id, JSON.stringify(face_embedding), sample_index || 0, quality_score || null, model_version || 'face-api-ssd-mobilenetv1']
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('POST /api/employees/bio-data error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/employees/bio-data/all - Fetch all face embeddings from VPS DB
router.get('/bio-data/all', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT f.id, f.employee_id, f.face_embedding, f.sample_index, f.quality_score,
             p.id as profile_id, p.full_name, p.email, p.requested_role as role
      FROM face_embeddings f
      LEFT JOIN profiles p ON f.employee_id::text = p.id::text
    `);
    
    const mapped = rows.map(r => ({
      id: r.id,
      employee_id: r.employee_id,
      face_embedding: r.face_embedding,
      sample_index: r.sample_index,
      quality_score: r.quality_score,
      employees: {
        id: r.profile_id,
        full_name: r.full_name,
        email: r.email,
        role: r.role
      }
    }));
    
    res.json(mapped);
  } catch (err) {
    console.error('GET /api/employees/bio-data/all error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/employees/:id/bio-data - Fetch face embeddings for an employee from VPS DB
router.get('/:id/bio-data', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM face_embeddings WHERE employee_id::text = $1 ORDER BY sample_index',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/employees/:id/bio-data error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/employees/:id/bio-data - Delete face embeddings for an employee from VPS DB
router.delete('/:id/bio-data', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      'DELETE FROM face_embeddings WHERE employee_id::text = $1',
      [id]
    );
    res.json({ success: true, message: 'Face embeddings deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/employees/:id/bio-data error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/employees/:id/reset-password - Password reset removed as Supabase is decoupled
router.post('/:id/reset-password', requireAuth, async (req, res) => {
  try {
    return res.status(400).json({ error: 'Password reset is disabled while migrating away from Supabase.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
