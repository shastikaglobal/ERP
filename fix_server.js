const fs = require('fs');
const path = 'e:/SHASTI/backuperp/backuperp/adms-sync/server.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix the error logging
content = content.replace(
  /console\.error\('SMTP\/Resend Error details:', mailErr\);/g,
  "console.error('SMTP/Resend Error details:', JSON.stringify(mailErr, Object.getOwnPropertyNames(mailErr), 2));"
);

// 2. Fix the missing user message (using regex to catch formatting)
content = content.replace(
  /return res\.json\(\{ success: true, message: 'Your password reset request has been sent to the system administrator\. Please wait for the administrator to provide your temporary password\.' \}\);/g,
  "return res.json({ success: true, message: 'If this email is registered, a reset link has been sent.' });"
);

// 3. Fix the success message
content = content.replace(
  /return res\.json\(\{ success: true, message: `Password reset link sent to \$\{user\.email\}\.` \}\);/g,
  "return res.json({ success: true, message: 'If this email is registered, a reset link has been sent.' });"
);

// 4. Find the duplicate block and remove it.
const lines = content.split('\n');
let firstMe = -1;
let secondMe = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("app.get('/api/auth/me'")) {
        if (firstMe === -1) firstMe = i;
        else if (secondMe === -1) secondMe = i;
    }
}

if (secondMe !== -1) {
    let endDuplicate = -1;
    // Search for app.put('/api/auth/update-password' which appears AFTER the duplicate block.
    for (let i = secondMe; i < lines.length; i++) {
        if (lines[i].includes("app.put('/api/auth/update-password'")) {
            endDuplicate = i - 1;
            break;
        }
    }
    
    if (endDuplicate !== -1) {
        // trace back to the closing }); 
        while(endDuplicate > secondMe && !lines[endDuplicate].includes('});')) {
            endDuplicate--;
        }
        console.log(`Deleting lines ${secondMe + 1} to ${endDuplicate + 1}`);
        lines.splice(secondMe, endDuplicate - secondMe + 1);
        content = lines.join('\n');
    } else {
        console.log("Could not find the end of the duplicate block!");
    }
} else {
    console.log("Could not find second app.get('/api/auth/me')");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Done updating server.js");
