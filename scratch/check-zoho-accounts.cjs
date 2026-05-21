const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0] === 'VITE_SUPABASE_URL') url = parts[1].trim().replace(/['"]/g, '');
  if (parts[0] === 'VITE_SUPABASE_ANON_KEY') key = parts[1].trim().replace(/['"]/g, '');
});

const supabase = createClient(url, key);

async function run() {
  const messageId = "1778642099755015800"; // Zoho message ID we found
  
  // Test Accounts
  const accounts = [
    { name: "manager", email: "manager@shastikaglobalimpex.co.in", token: "1000.2c06913f96d946dc7351363c1ea11fd7.eebc064661fef87b9b44a27b43e4f2f0" },
    { name: "bde", email: "bde@shastikaglobalimpex.co.in", token: "1000.6addb24be696b4f42b55fac33eb080c0.d79b3117bb82ef2af55a2e7e9f6e165d" }
  ];

  for (const acc of accounts) {
    console.log(`\nTesting account: ${acc.email}...`);
    const apiDomain = acc.email.endsWith('.com') ? 'zoho.com' : 'zoho.in';

    try {
      // 1. Get Zoho verified Account ID
      const accountsResponse = await fetch(`https://mail.${apiDomain}/api/accounts`, {
        headers: { Authorization: `Zoho-oauthtoken ${acc.token}` },
      });
      const accountsData = await accountsResponse.json();
      const verifiedZohoId = accountsData.data?.[0]?.accountId;
      console.log(`Verified Zoho Account ID for ${acc.name}: ${verifiedZohoId}`);

      if (!verifiedZohoId) {
        console.log(`Could not verify account ${acc.email}`);
        continue;
      }

      // 2. Get Folders
      const foldersResponse = await fetch(`https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders`, {
        headers: { Authorization: `Zoho-oauthtoken ${acc.token}` },
      });
      const foldersData = await foldersResponse.json();
      
      // Try to find the message in folders
      for (const folder of foldersData.data || []) {
        // Only check Inbox and Sent to be fast
        if (folder.folderName.toLowerCase() !== 'inbox' && folder.folderName.toLowerCase() !== 'sent') continue;
        
        console.log(`  Checking folder: ${folder.folderName} (ID: ${folder.folderId})...`);
        const contentUrl = `https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders/${folder.folderId}/messages/${messageId}/content`;
        const contentResponse = await fetch(contentUrl, {
          headers: { Authorization: `Zoho-oauthtoken ${acc.token}` },
        });
        const contentData = await contentResponse.json();

        if (contentResponse.ok) {
          console.log(`  🎉 SUCCESS! Message found in ${acc.email} -> ${folder.folderName}`);
          
          // Let's get attachmentinfo
          const attUrl = `https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders/${folder.folderId}/messages/${messageId}/attachmentinfo`;
          const attRes = await fetch(attUrl, {
            headers: { Authorization: `Zoho-oauthtoken ${acc.token}` },
          });
          const attData = await attRes.json();
          console.log("  Attachment info response:", JSON.stringify(attData, null, 2));
        } else {
          console.log(`  ❌ Failed in ${folder.folderName}:`, contentData.status?.description || JSON.stringify(contentData));
        }
      }
    } catch (e) {
      console.error(`Error with ${acc.email}:`, e);
    }
  }
}

run();
