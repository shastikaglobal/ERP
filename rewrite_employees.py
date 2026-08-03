import re

with open(r"e:\SHASTI\backuperp\backuperp\adms-sync\routes\employees.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove supabase require and init
content = re.sub(r"const \{ createClient \} = require\('@supabase/supabase-js'\);\n\n// Supabase admin client — profiles, roles, user_roles live here\nconst supabase = createClient\(\n  process\.env\.VITE_SUPABASE_URL \|\| process\.env\.SUPABASE_URL,\n  process\.env\.SUPABASE_SERVICE_ROLE_KEY\n\);\n", "", content)

# 2. Add bcryptjs require
content = content.replace("const db = require('../db');\nconst { requireAuth } = require('../middleware/auth');", "const db = require('../db');\nconst { requireAuth } = require('../middleware/auth');\nconst bcrypt = require('bcryptjs');\nconst crypto = require('crypto');")

# 3. syncProfileToLocalDb -> remove supabase logic inside it
new_sync_func = """async function syncProfileToLocalDb(id, updates) {
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
}"""
content = re.sub(r"async function syncProfileToLocalDb\(id, updates\) \{.*?\n\}\n", new_sync_func + "\n", content, flags=re.DOTALL)

# 4. GET /api/employees fallback removal
content = re.sub(r"    try \{\n      const \{ rows \} = await db\.query\(`\n        SELECT id, company_id.*?\n      `\);\n      return res\.json\(rows\);\n    \} catch \(dbErr\) \{\n      console\.warn\('\[API /employees\] Local query failed, trying Supabase:', dbErr\.message\);\n    \}\n\n    const \{ data, error \} = await supabase.*?\n    if \(error\) throw error;\n    res\.json\(data \|\| \[\]\);", 
"""    const { rows } = await db.query(`
      SELECT id, company_id, full_name, email, phone, requested_role, status, is_active, 
             avatar_url, biometric_id, dob, joining_date, system_mode, city, 
             monthly_salary, punch_deadline, department 
      FROM profiles 
      WHERE status = 'approved' AND (is_deleted IS NOT TRUE)
      ORDER BY full_name
    `);
    return res.json(rows);""", content, flags=re.DOTALL)

# 5. GET /api/employees/all/profiles fallback removal
content = re.sub(r"    try \{\n      const \{ rows \} = await db\.query\(`\n        SELECT id, company_id.*?\n      `\);\n      return res\.json\(rows\);\n    \} catch \(dbErr\) \{\n      console\.warn\('\[API /employees/all/profiles\] Local query failed, trying Supabase:', dbErr\.message\);\n    \}\n\n    const \{ data, error \} = await supabase.*?\n    if \(error\) throw error;\n    res\.json\(data \|\| \[\]\);", 
"""    const { rows } = await db.query(`
      SELECT id, company_id, full_name, email, phone, role, requested_role, status, rejection_reason, 
             created_at, department, is_active, biometric_id, monthly_salary, joining_date 
      FROM profiles 
      WHERE is_deleted IS NOT TRUE 
      ORDER BY created_at DESC
    `);
    return res.json(rows);""", content, flags=re.DOTALL)

# 6. GET /api/employees/lookup-id/:id fallback removal
content = re.sub(r"    console\.log\(`\[Lookup ID\] Not found locally, checking Supabase\.\.\.`\);\n    const \{ data, error \} = await supabase.*?\n\n    return res\.status\(404\)\.json\(\{ error: 'Employee ID not found' \}\);",
"    return res.status(404).json({ error: 'Employee ID not found' });", content, flags=re.DOTALL)

# 7. GET /api/employees/:id fallback removal
content = re.sub(r"    // Try local database first\n    const \{ rows \} = await db\.query\('SELECT \* FROM profiles WHERE id = \$1 LIMIT 1', \[id\]\);\n    if \(rows\.length > 0\) \{\n      return res\.json\(rows\[0\]\);\n    \}\n\n    // Fallback: check Supabase.*?\n    if \(!data\) return res\.status\(404\)\.json\(\{ error: 'Not found' \}\);\n    res\.json\(data\);",
"""    const { rows } = await db.query('SELECT * FROM profiles WHERE id = $1 LIMIT 1', [id]);
    if (rows.length > 0) {
      return res.json(rows[0]);
    }
    return res.status(404).json({ error: 'Not found' });""", content, flags=re.DOTALL)

# 8. POST /api/employees/register - replace supabase auth with bcrypt
old_register = """    // Check if biometric_id/employee_id is already registered
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
    }"""
new_register = """    if (empId) {
      const { rows: existingId } = await db.query('SELECT id, full_name FROM profiles WHERE employee_id = $1 OR biometric_id = $1 LIMIT 1', [empId]);
      if (existingId.length > 0) {
        return res.status(400).json({ error: `Employee ID "${empId}" is already registered.` });
      }
    } else {
      const { rows: existingEmail } = await db.query('SELECT id, full_name FROM profiles WHERE email = $1 LIMIT 1', [signUpEmail]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: `Email "${signUpEmail}" is already registered.` });
      }
    }
    
    console.log(`[Signup API] Creating auth user for email ${signUpEmail}...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    
    await db.query(
      `INSERT INTO profiles (id, email, password_hash, full_name, employee_id, biometric_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [userId, signUpEmail, hashedPassword, signUpEmail, empId || null, empId || null]
    );"""
content = content.replace(old_register, new_register)

# 9. POST /api/employees - remove Supabase try/catch
old_post_emp = """    // Try Supabase
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({ id, full_name, email, requested_role, status: 'approved' });
      if (error) throw error;
    } catch (supaErr) {
      console.warn('[Sync] Supabase profile insert failed/ignored:', supaErr.message);
    }"""
content = content.replace(old_post_emp, "")

# 10. PUT /api/employees/:id - remove Supabase update
old_put_emp = """    // 2. Try to update Supabase in the background (non-blocking)
    supabase.from('profiles').update(updates).eq('id', id)
      .then(({ error }) => {
        if (error) console.warn(`[Sync] Supabase profile update failed/ignored (restricted quota):`, error.message);
      })
      .catch(supabaseErr => {
        console.warn(`[Sync] Supabase profile update exception:`, supabaseErr.message);
      });"""
content = content.replace(old_put_emp, "")

# 11. DELETE /api/employees/:id - remove Supabase update
old_delete_emp = """    // 2. Try Supabase
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false, is_deleted: true, deleted_at, deleted_by })
        .eq('id', id);
      if (error) throw error;
    } catch (supaErr) {
      console.warn('[Sync] Supabase profile soft-delete failed/ignored:', supaErr.message);
    }"""
content = content.replace(old_delete_emp, "")

# 12. PUT /api/employees/all/profiles/:id - remove Supabase background updates
content = re.sub(r"      // Try Supabase update in background \(non-blocking\)\n      supabase\.from\('profiles'\)\.update\(profileUpdate\)\.eq\('id', id\).*?\}\);\n", "", content, flags=re.DOTALL)
content = re.sub(r"        // Try Supabase role sync in background \(non-blocking\)\n        supabase\.from\('roles'\)\.select.*?\n          \}\);\n", "", content, flags=re.DOTALL)

# 13. POST /api/employees/:id/reset-password - replace entire logic with simple local password reset logic
old_reset_pwd = re.compile(r"// POST /api/employees/:id/reset-password.*?module\.exports = router;\n", re.MULTILINE | re.DOTALL)
new_reset_pwd = """// POST /api/employees/:id/reset-password - Password reset removed as Supabase is decoupled
router.post('/:id/reset-password', requireAuth, async (req, res) => {
  try {
    return res.status(400).json({ error: 'Password reset is disabled while migrating away from Supabase.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
"""
content = old_reset_pwd.sub(new_reset_pwd, content)

# 14. Check /api/employees/:id/reset-password auth check
content = re.sub(r"    let isAuthorized = req\.user\.email === 'shastikaglobal11@gmail\.com';\n.*?isAuthorized = requesterProfile && \(.*?\);\n    \}", "", content, flags=re.DOTALL)

with open(r"e:\SHASTI\backuperp\backuperp\adms-sync\routes\employees.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten successfully")
