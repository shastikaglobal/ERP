require('dotenv').config({ path: '../.env' });
const jwt = require('jsonwebtoken');
const db = require('./db');
const fetch = require('node-fetch');

async function testAdminReset() {
  try {
    if (!process.env.JWT_SECRET) {
      console.log('NO JWT_SECRET FOUND!');
      process.exit(1);
    }
    
    // 1. Get Employee ID to reset
    const { rows } = await db.query("SELECT id FROM profiles WHERE email = 'kim.swathi.07@gmail.com'");
    if (rows.length === 0) {
      console.log('User not found in DB');
      process.exit(1);
    }
    const targetId = rows[0].id;
    
    // 2. Get an admin user ID to act as requester
    const { rows: adminRows } = await db.query("SELECT user_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.slug = 'admin' LIMIT 1");
    let adminId = targetId; // fallback to self if no admin
    if (adminRows.length > 0) {
      adminId = adminRows[0].user_id;
    }
    
    // 3. Generate Admin JWT
    const adminToken = jwt.sign({ sub: adminId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // 4. Make Request
    const response = await fetch(`http://localhost:8082/api/employees/${targetId}/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log("API Response:", result);
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

testAdminReset();
