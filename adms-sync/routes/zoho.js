const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const FormData = require('form-data');
const fsPromises = require('fs/promises');
const pathModule = require('path');

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
    const fetch = require('node-fetch'); // we need node-fetch or native fetch (Node 18+)
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

module.exports = router;
