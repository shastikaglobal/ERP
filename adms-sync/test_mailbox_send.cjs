require('dotenv').config({ path: '../.env' });
const jwt = require('jsonwebtoken');
const db = require('./db');
const fetch = require('node-fetch');

async function testMailboxSend() {
  try {
    console.log('Fetching account for shastikabde2...');
    const { rows: accRows } = await db.query("SELECT * FROM zoho_accounts WHERE account_email = 'shastikabde2@shastikaglobalimpex.co.in' LIMIT 1");
    if (accRows.length === 0) {
      console.log('Account not found in DB');
      process.exit(1);
    }
    const account = accRows[0];
    
    console.log('Generating JWT token...');
    const adminToken = jwt.sign({ sub: account.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Create a dummy record to send
    const testRecord = {
      account_id: account.id,
      from_address: account.account_email,
      to_address: 'shastikaglobal11@gmail.com', // Sending a test email to the admin
      subject: 'Test Email from ERP Mailbox API',
      body_text: 'This is a test email to verify Zoho App Password authentication.',
      body_html: '<p>This is a test email to verify <strong>Zoho App Password</strong> authentication.</p>',
    };
    
    console.log('Calling /api/emails/send endpoint...');
    const response = await fetch(`http://localhost:8082/api/emails/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ record: testRecord })
    });
    
    const result = await response.json();
    console.log("API Response:", JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

testMailboxSend();
