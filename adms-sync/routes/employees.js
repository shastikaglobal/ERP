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
      console.log(`[Sync] Profile ${id} not found locally during update.`);
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
        WHERE status = 'approved' AND (deleted_at IS NULL)
        ORDER BY full_name
      `);
      return res.json(rows);
    } catch (dbErr) {
      console.error('[API /employees] Local query failed:', dbErr.message);
      throw dbErr;
    }
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
        WHERE deleted_at IS NULL 
        ORDER BY created_at DESC
      `);
      return res.json(rows);
    } catch (dbErr) {
      console.error('[API /employees/all/profiles] Local query failed:', dbErr.message);
      throw dbErr;
    }
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
      `SELECT email, full_name, role FROM profiles WHERE (employee_id = $1 OR biometric_id = $2) AND deleted_at IS NULL LIMIT 1`,
      [id, id]
    );

    if (rows.length > 0) {
      console.log(`[Lookup ID] Found locally: ${rows[0].email} (${rows[0].full_name})`);
      return res.json({ email: rows[0].email, full_name: rows[0].full_name, role: rows[0].role });
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
       WHERE ur.user_id = $1 AND ur.deleted_at IS NULL`,
      [id]
    );

    // 2. Get permissions
    const { rows: perms } = await db.query(
      `SELECT p.code 
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1 AND ur.deleted_at IS NULL`,
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

    return res.status(404).json({ error: 'Not found' });
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
      const { rows: existingId } = await db.query(
        'SELECT id, full_name FROM profiles WHERE employee_id = $1 OR biometric_id = $1 LIMIT 1',
        [empId]
      );
      if (existingId.length > 0) {
        return res.status(400).json({ error: `Employee ID "${empId}" is already registered.` });
      }
    } else {
      const { rows: existingEmail } = await db.query(
        'SELECT id, full_name FROM profiles WHERE email = $1 LIMIT 1',
        [signUpEmail]
      );
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: `Email "${signUpEmail}" is already registered.` });
      }
    }
    
    console.log(`[Signup API] Creating local auth user for email ${signUpEmail}...`);
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Insert into local profiles
    await db.query(`
      INSERT INTO profiles (email, password_hash, employee_id, biometric_id, status, role, is_active, created_at)
      VALUES ($1, $2, $3, $4, 'pending', 'user', true, NOW())
    `, [signUpEmail, passwordHash, empId, empId]);
    
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
            DO UPDATE SET role_id = EXCLUDED.role_id, deleted_at IS NULL, deleted_at = NULL, deleted_by = NULL
          `, [id, roleId]);
          console.log(`[ROLE SYNC] User ${id} assigned role '${requested_role}' in local DB`);
        } catch (localUrErr) {
          console.error(`[Sync] Local user_roles insertion failed:`, localUrErr.message);
          throw localUrErr;
        }
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

// POST /api/employees/:id/reset-password - Local DB password reset implementation
router.post('/:id/reset-password', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const { rows: users } = await db.query('SELECT email FROM profiles WHERE id = $1 LIMIT 1', [id]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const email = users[0].email;
    if (!email) return res.status(400).json({ error: 'User does not have an email' });
    
    // Generate secure token (30 min expiration)
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    // Ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id UUID,
        reset_token_hash VARCHAR(255),
        expires_at TIMESTAMP,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `).catch(() => {});
    
    await db.query(
      'INSERT INTO password_resets (user_id, reset_token_hash, expires_at) VALUES ($1, $2, $3)',
      [id, tokenHash, expiresAt]
    );
    
    const resetLink = `${req.headers.origin || 'http://localhost:8080'}/auth?mode=reset&token=${resetToken}`;
    
    return res.json({ success: true, link: resetLink, message: 'Password reset link generated successfully' });
  } catch (err) {
    console.error('POST /api/employees/:id/reset-password error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/employees/:id/preferences
router.get('/:id/preferences', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM user_preferences WHERE user_id = $1 LIMIT 1', [id]);
    if (rows.length > 0) {
      return res.json(rows[0]);
    }
    res.json({});
  } catch (err) {
    console.error('GET /api/employees/:id/preferences error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/employees/:id/preferences
router.put('/:id/preferences', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if exists
    const { rows } = await db.query('SELECT id FROM user_preferences WHERE user_id = $1', [id]);
    
    if (rows.length > 0) {
      // Update
      const keys = Object.keys(updates);
      if (keys.length > 0) {
        const setClauses = keys.map((key, index) => `"${key}" = $${index + 1}`);
        const values = keys.map(key => updates[key]);
        await db.query(`UPDATE user_preferences SET ${setClauses.join(', ')} WHERE user_id = $${keys.length + 1}`, [...values, id]);
      }
    } else {
      // Insert
      updates.user_id = id;
      const keys = Object.keys(updates);
      const cols = keys.map(k => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map(key => updates[key]);
      await db.query(`INSERT INTO user_preferences (${cols}) VALUES (${placeholders})`, values);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/employees/:id/preferences error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
