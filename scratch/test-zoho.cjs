const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env from parent directory
const envPath = path.join(__dirname, '..', '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0] === 'VITE_SUPABASE_URL') url = parts[1].trim().replace(/['"]/g, '');
  if (parts[0] === 'VITE_SUPABASE_ANON_KEY') key = parts[1].trim().replace(/['"]/g, '');
});

// Since anon key doesn't have bypass_rls, let's look if we have service key.
// But wait, the .env might only have anon key.
// Let's print out what we found
console.log("Supabase URL:", url);

const supabase = createClient(url, key);

async function run() {
  // Let's get the email from DB first
  const { data: emails, error: emailError } = await supabase
    .from('emails')
    .select('*')
    .ilike('body_text', '%Kindly find the attachment%')
    .limit(1);

  if (emailError) {
    console.error("DB Error:", emailError);
    return;
  }

  if (!emails || emails.length === 0) {
    console.log("No email found matching 'Kindly find the attachment'");
    return;
  }

  const email = emails[0];
  console.log("Found email:", {
    id: email.id,
    subject: email.subject,
    zoho_message_id: email.zoho_message_id,
    account_id: email.account_id,
    folder: email.folder
  });

  // Get Zoho Account
  const { data: account, error: accError } = await supabase
    .from('zoho_accounts')
    .select('*')
    .eq('id', email.account_id)
    .single();

  if (accError || !account) {
    console.error("Account error:", accError);
    return;
  }

  console.log("Found Zoho account:", account.account_email);
  const apiDomain = account.account_email.endsWith('.com') ? 'zoho.com' : 'zoho.in';

  // Refresh token
  let accessToken = account.access_token;
  console.log("Using access token...");

  // Get Account ID from Zoho API
  const accountsResponse = await fetch(`https://mail.${apiDomain}/api/accounts`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });
  const accountsData = await accountsResponse.json();
  const verifiedZohoId = accountsData.data?.[0]?.accountId;
  console.log("Verified Zoho Account ID:", verifiedZohoId);

  // Get Folders
  const foldersResponse = await fetch(`https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });
  const foldersData = await foldersResponse.json();
  console.log("Folders count:", foldersData.data?.length);

  // Try to find where the message is!
  // We will iterate through all folders and see if we can get the content of the message!
  for (const folder of foldersData.data || []) {
    console.log(`Checking folder: ${folder.folderName} (ID: ${folder.folderId})...`);
    const contentUrl = `https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders/${folder.folderId}/messages/${email.zoho_message_id}/content`;
    const contentResponse = await fetch(contentUrl, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });
    const contentData = await contentResponse.json();

    if (contentResponse.ok) {
      console.log(`🎉 SUCCESS! Message found in folder: ${folder.folderName}`);
      console.log("Content length:", contentData.data?.content?.length);
      
      // Let's try to get attachmentinfo
      const attUrl = `https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders/${folder.folderId}/messages/${email.zoho_message_id}/attachmentinfo`;
      const attRes = await fetch(attUrl, {
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
      });
      const attData = await attRes.json();
      console.log("Attachment info response:", JSON.stringify(attData, null, 2));
      break;
    } else {
      console.log(`❌ Failed in ${folder.folderName}:`, contentData.status?.description || JSON.stringify(contentData));
    }
  }
}

run();
