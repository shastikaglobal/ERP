const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const { rows: existing } = await db.query('SELECT id FROM profiles WHERE email = $1 LIMIT 1', [email.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { rows } = await db.query(
      'INSERT INTO profiles (email, password_hash, full_name, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role',
      [email.trim(), passwordHash, full_name, 'admin', 'active']
    );

    const user = rows[0];
    const secret = process.env.JWT_SECRET;
    const accessToken = jwt.sign({
      sub: user.id,
      email: user.email,
      role: 'authenticated',
      aud: 'authenticated'
    }, secret, { expiresIn: '1h' });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshHash, expiresAt]
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
      });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
      });

    res.json({
      session: {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: { full_name: user.full_name, force_password_reset: user.force_password_reset }
        }
      }
    });
  } catch (err) {
    console.error('VPS auth signup error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log(`[VPS Auth] Attempting login for email: ${email}`);

    // Look up in the local VPS profiles table
    const { rows } = await db.query(
      'SELECT id, full_name, email, role, status, password_hash, force_password_reset FROM profiles WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
      [email.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const user = rows[0];

    // Verify password using bcrypt
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid login credentials. Please reset your password if you migrated from Supabase.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    console.log(`[VPS Auth] Valid credentials for ${user.full_name}. Issuing tokens...`);

    const secret = process.env.JWT_SECRET;
    
    // Issue Access Token (short lived, e.g. 1 hour)
    const accessToken = jwt.sign({
      sub: user.id,
      email: user.email,
      role: 'authenticated',
      aud: 'authenticated'
    }, secret, { expiresIn: '1h' });

    // Issue Refresh Token (long lived, e.g. 30 days)
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Store refresh token in DB
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshHash, expiresAt]
    );

    // Set HttpOnly Cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });

    res.json({
      session: {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: { full_name: user.full_name }
        }
      }
    });
  } catch (err) {
    console.error('VPS auth login error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/me', require('../middleware/auth').requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, company_id, full_name, email, avatar_url, status, requested_role, rejection_reason, phone, dob, joining_date, system_mode, city, biometric_id, department, employee_id, role, force_password_reset FROM profiles WHERE id = $1 LIMIT 1',
      [req.user.sub]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch(err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/roles', require('../middleware/auth').requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT r.slug, p.code 
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = $1
    `, [req.user.sub]);

    res.json({ roles: rows });
  } catch(err) {
    console.error('Fetch roles error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    try {
      await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [refreshHash]);
    } catch(err) {
      console.error('Logout cleanup error:', err);
    }
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  try {
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const { rows } = await db.query(
      'SELECT user_id, expires_at FROM refresh_tokens WHERE token_hash = $1',
      [refreshHash]
    );

    if (rows.length === 0) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (new Date() > rows[0].expires_at) {
      await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [refreshHash]);
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const userId = rows[0].user_id;
    const { rows: userRows } = await db.query(
      'SELECT email FROM profiles WHERE id = $1 AND is_active = true AND deleted_at IS NULL',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ error: 'User inactive or deleted' });
    }

    const secret = process.env.JWT_SECRET;
    const accessToken = jwt.sign({
      sub: userId,
      email: userRows[0].email,
      role: 'authenticated',
      aud: 'authenticated'
    }, secret, { expiresIn: '1h' });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
      });

    res.json({ success: true });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // 1. Fetch user from local profiles
    const { rows } = await db.query(
      'SELECT id, full_name, email FROM profiles WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
      [email.trim()]
    );

    if (rows.length === 0) {
      return res.json({ success: true, message: 'Your password reset request has been sent to the system administrator. Please wait for the administrator to provide your temporary password.' });
    }
    const user = rows[0];

    // 2. Generate secure token (15-30 min expiration)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await db.query(
      'INSERT INTO password_resets (user_id, reset_token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    // Audit log
    await db.query('INSERT INTO password_reset_audit (user_id, email, action) VALUES ($1, $2, $3)', [user.id, user.email, 'REQUESTED']);

    // 3. Send email to User directly via Resend
    const isResend = !!process.env.RESEND_API_KEY;
    const transporter = nodemailer.createTransport({
      host: isResend ? 'smtp.resend.com' : (process.env.SMTP_HOST || 'smtp.zoho.in'),
      port: isResend ? 465 : (process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: isResend ? 'resend' : (process.env.SMTP_USER || 'erp@shastikaglobal.com'),
        pass: isResend ? process.env.RESEND_API_KEY : (process.env.SMTP_PASS || 'default_password_here')
      }
    });

    const actionLink = `${req.headers.origin || 'http://localhost:8080'}/auth?mode=reset&token=${resetToken}`;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>🔑 Password Reset Request</h2>
        <p>Hi ${user.full_name},</p>
        <p>You recently requested to reset your password for your AgriExport ERP account. Click the button below to proceed:</p>
        <a href="${actionLink}" style="background-color: #f5c518; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px; font-weight: bold;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">This secure link expires in 30 minutes and can only be used once.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `;

    try {
      const fromEmail = isResend ? 'onboarding@resend.dev' : (process.env.SMTP_USER || 'erp@shastikaglobal.com');
      const toEmail = user.email;
      
      console.log('--- PASSWORD RESET EMAIL DEBUG ---');
      console.log('Sending email VIA:', isResend ? 'RESEND' : 'SMTP');
      console.log('FROM address:', fromEmail);
      console.log('TO address:', toEmail);
      console.log('API Key / Pass length:', isResend ? process.env.RESEND_API_KEY?.length : process.env.SMTP_PASS?.length);
      console.log('----------------------------------');

      const info = await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: `Password Reset - AgriExport ERP`,
        html: htmlContent
      });
      
      console.log('--- EMAIL SEND SUCCESS ---');
      console.log('Response:', info);
      console.log('--------------------------');
      
      return res.json({ success: true, message: `Password reset link sent to ${user.email}.` });
    } catch (mailErr) {
      console.error('--- EMAIL SEND FAILED ---');
      console.error('SMTP/Resend Error details:', mailErr);
      console.error('-------------------------');
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send password reset email. Please check the email service configuration or contact the administrator.' 
      });
    }
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/update-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { rows } = await db.query(
      'SELECT user_id, expires_at FROM password_resets WHERE reset_token_hash = $1',
      [tokenHash]
    );

    if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired reset token' });
    
    if (new Date() > rows[0].expires_at) {
      await db.query('DELETE FROM password_resets WHERE reset_token_hash = $1', [tokenHash]);
      return res.status(400).json({ error: 'Token expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user profile - Force them to reset on next login!
    await db.query('UPDATE profiles SET password_hash = $1, force_password_reset = true, updated_at = NOW() WHERE id = $2', [passwordHash, rows[0].user_id]);
    
    // Audit log
    await db.query('INSERT INTO password_reset_audit (user_id, action) VALUES ($1, $2)', [rows[0].user_id, 'COMPLETED']);

    // Cleanup token (One-time use)
    await db.query('DELETE FROM password_resets WHERE reset_token_hash = $1', [tokenHash]);

    res.json({ success: true, message: 'Temporary password created successfully. The employee must change it on their next login.' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.put('/update-password', require('../middleware/auth').requireAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const userId = req.user.sub;
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user profile
    await db.query('UPDATE profiles SET password_hash = $1, force_password_reset = false, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Update password error (PUT):', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
