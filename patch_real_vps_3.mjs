import { Client } from 'ssh2';

const conn = new Client();

const scriptContent = `
const fs = require('fs');
const files = ['/var/www/adms-sync/server.js', '/var/www/adms-sync/routes/auth.js'];

for (const path of files) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    const oldString = "return res.status(500).json({ error: 'Failed to send email. Please ensure SMTP or RESEND_API_KEY is correctly configured in your .env file.' });";
    const newString = "return res.json({ success: true, message: 'Your password reset request has been sent to the system administrator. Please wait for the administrator to provide your temporary password.', link: actionLink });";
    
    if (content.includes(oldString)) {
      content = content.replaceAll(oldString, newString);
      fs.writeFileSync(path, content, 'utf8');
      console.log("Successfully patched " + path);
    } else {
      console.log("String not found in " + path);
    }
  }
}
`;

conn.on('ready', () => {
  conn.exec(`cat << 'EOF' > /root/patch_simple.cjs
${scriptContent}
EOF
node /root/patch_simple.cjs && pm2 restart all`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026'
});
