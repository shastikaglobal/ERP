const fs = require('fs');
let c = fs.readFileSync('adms-sync/routes/employees.js', 'utf8');

const target = `// POST /api/employees/:id/reset-password - Password reset removed as legacyDb is decoupled
router.post('/:id/reset-password', requireAuth, async (req, res) => {
  try {
    return res.status(400).json({ error: 'Password reset is disabled while migrating away from legacyDb.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});`;

const replacement = `// POST /api/employees/:id/reset-password
router.post('/:id/reset-password', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Generate secure token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      'INSERT INTO password_resets (user_id, reset_token_hash, expires_at) VALUES ($1, $2, $3)',
      [id, tokenHash, expiresAt]
    );
    
    const actionLink = \`\${req.headers.origin || 'http://localhost:8080'}/auth?mode=reset&token=\${resetToken}\`;
    return res.json({ success: true, link: actionLink, message: "Reset link generated." });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});`;

c = c.replace(target, replacement);

fs.writeFileSync('adms-sync/routes/employees.js', c);
