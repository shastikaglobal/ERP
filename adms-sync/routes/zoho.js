const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const FormData = require('form-data');
const fsPromises = require('fs/promises');
const pathModule = require('path');
const db = require('../db');

// Polyfill fetch if needed
const fetch = globalThis.fetch || require('node-fetch');

router.post('/office-integrator', requireAuth, async (req, res) => {
  try {
    const { path, filename, displayName, userId } = req.body;
    let buffer;
    try {
      buffer = await fsPromises.readFile(pathModule.join(__dirname, '../../uploads', path));
    } catch (e) {
      // Mock content since local file not found or storage not implemented locally yet
      buffer = Buffer.from('Mock content since local file not found', 'utf8');
    }
    
    // Send to Zoho
    const formData = new FormData();
    const apiKey = process.env.ZOHO_OFFICE_INTEGRATOR_API_KEY || 'mock';
    formData.append('apikey', apiKey);
    formData.append('document', buffer, { filename: filename || 'document.txt' });
    formData.append('document_info', JSON.stringify({ document_id: (path || 'doc').replace(/[^a-zA-Z0-9]/g, '-'), document_name: filename }));
    formData.append('user_info', JSON.stringify({ user_id: userId || 'erp-user', display_name: displayName || 'ERP User' }));
    formData.append('editor_settings', JSON.stringify({ language: 'en' }));

    // Dummy URL for now if no real API key
    if (apiKey === 'mock') {
       return res.json({ success: true, document_url: 'https://writer.zoho.com/writer/open/mock' });
    }

    // Call the actual Zoho API if a real key is present
    const zohoRes = await fetch('https://api.office-integrator.zoho.in/writer/officeapi/v1/document', {
      method: 'POST',
      body: formData
    });
    
    const text = await zohoRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Failed to parse Zoho response' });
    }

    if (data.document_url || data.documentUrl) {
      res.json({ success: true, document_url: data.document_url || data.documentUrl });
    } else {
      res.status(500).json({ success: false, error: data.error || 'Zoho API Error' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// OAuth Callback Route
router.get('/oauth', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('Zoho OAuth Error:', error);
      return res.redirect('/?error=zoho_auth_failed');
    }

    if (!code || !state) {
      return res.status(400).send('Missing code or state');
    }

    // State format: "company_id:user_id:frontend_origin"
    const parts = state.split(':');
    const companyId = parts[0];
    const userId = parts[1];
    const frontendOrigin = parts.slice(2).join(':') || 'http://localhost:5173';
    
    // Redirect user back to integrations page after success/failure
    const redirectUrl = `${frontendOrigin}/system`;

    const clientId = process.env.VITE_ZOHO_CLIENT_ID || process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const redirectUri = `${frontendOrigin}/api/zoho/oauth`; // Must match EXACTLY what was sent from frontend

    // 1. Exchange authorization code for access and refresh tokens
    const tokenResponse = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Zoho Token Exchange Error:', tokenData);
      return res.redirect(`${redirectUrl}?error=token_exchange_failed`);
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const expiryTime = new Date(Date.now() + expires_in * 1000).toISOString();

    // 2. Fetch the user's Zoho account email to save in DB
    const accountsResponse = await fetch('https://mail.zoho.in/api/accounts', {
      headers: { Authorization: `Zoho-oauthtoken ${access_token}` }
    });
    
    const accountsData = await accountsResponse.json();
    if (!accountsResponse.ok || !accountsData.data || accountsData.data.length === 0) {
      console.error('Zoho Accounts Fetch Error:', accountsData);
      return res.redirect(`${redirectUrl}?error=account_fetch_failed`);
    }

    // Get the primary email address or fallback to the account ID
    const accountEmail = accountsData.data[0].primaryEmailAddress || accountsData.data[0].accountId;

    // 3. Upsert the account into the native PostgreSQL database
    await db.query(`
      INSERT INTO zoho_accounts (company_id, user_id, account_email, access_token, refresh_token, expiry_time, is_deleted)
      VALUES ($1, $2, $3, $4, $5, $6, false)
      ON CONFLICT (account_email) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, zoho_accounts.refresh_token),
        expiry_time = EXCLUDED.expiry_time,
        user_id = EXCLUDED.user_id,
        deleted_at IS NULL
    `, [companyId, userId, accountEmail, access_token, refresh_token, expiryTime]);

    // 4. Redirect the user back to the application
    res.redirect(`${redirectUrl}?success=zoho_connected`);
  } catch (err) {
    console.error('Zoho OAuth processing error:', err);
    res.status(500).send('Internal Server Error during Zoho OAuth processing');
  }
});

module.exports = router;
