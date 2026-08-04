const db = require('./adms-sync/db');
const crypto = require('crypto');
const fs = require('fs');

async function run() {
  try {
    const { rows: profiles } = await db.query('SELECT id, employee_id, full_name, email FROM profiles WHERE is_deleted IS NOT TRUE');
    
    let mdTable = "| Login ID (Employee ID) | Name | Email | New Temporary Password |\n|---|---|---|---|\n";
    let count = 0;
    
    // I am reading the file because I just set them all
    const content = fs.readFileSync('passwords_output.md', 'utf-8');
    const lines = content.split('\n');
    
    for (const p of profiles) {
      if (!p.email) continue;
      
      // Find the password that was generated for this ID from the file
      let tempPass = 'N/A';
      for (const line of lines) {
        if (line.includes(p.id)) {
           // extract password from backticks
           const match = line.match(/`([^`]+)`/);
           if (match) tempPass = match[1];
           break;
        }
      }
      
      mdTable += `| ${p.employee_id || 'N/A'} | ${p.full_name || 'N/A'} | ${p.email} | \`${tempPass}\` |\n`;
      count++;
    }
    
    mdTable += `\n**Total accounts reset: ${count}**\n`;
    
    fs.writeFileSync('passwords_output_clean.md', mdTable);
    console.log("Done");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
