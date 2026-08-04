const fs = require('fs');

const content = fs.readFileSync('adms-sync/server.js', 'utf8');
const lines = content.split('\n');

let extracting = false;
let routeBuffer = [];
let openBrackets = 0;
let outputLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (!extracting) {
    if (line.includes('app.post(\'/api/auth/') || line.includes('app.get(\'/api/auth/') || line.includes('app.put(\'/api/auth/')) {
      extracting = true;
      routeBuffer = [];
      openBrackets = 0;
    }
  }

  if (extracting) {
    routeBuffer.push(line);
    
    // Count brackets to know when the route ends
    // This is a naive but effective way if properly formatted
    const openMatches = line.match(/\{/g);
    const closeMatches = line.match(/\}/g);
    
    if (openMatches) openBrackets += openMatches.length;
    if (closeMatches) openBrackets -= closeMatches.length;
    
    if (openBrackets <= 0 && routeBuffer.length > 0) {
      // The block has ended (openBrackets reached 0)
      outputLines.push(routeBuffer.join('\n'));
      outputLines.push(''); // blank line
      extracting = false;
    }
  }
}

let authContent = `const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

`;

outputLines.forEach(block => {
  authContent += block.replace(/app\.post\('\/api\/auth\//g, "router.post('/")
                      .replace(/app\.get\('\/api\/auth\//g, "router.get('/")
                      .replace(/app\.put\('\/api\/auth\//g, "router.put('/") + '\n';
});

authContent += `
module.exports = router;
`;

fs.writeFileSync('adms-sync/routes/auth.js', authContent);
console.log('Successfully extracted auth routes to adms-sync/routes/auth.js');
