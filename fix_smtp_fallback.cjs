const fs = require('fs');
const path = 'e:/SHASTI/backuperp/backuperp/adms-sync/server.js';
let content = fs.readFileSync(path, 'utf8');

const targetStart = "// 3. Send email to User directly via Resend";
const targetEnd = "return res.status(500).json({ error: 'Failed to send email. Please ensure SMTP or RESEND_API_KEY is correctly configured in your .env file.' });\n    }";

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd) + targetEnd.length;

if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
  console.error("Could not find the target block to replace.", { startIndex, endIndex });
  process.exit(1);
}

const replacement = `// 3. Send email to User directly
    let info = null;
    let primaryErr = null;
    const toEmail = user.email;

    const actionLink = \`\${req.headers.origin || 'http://localhost:8080'}/auth?mode=reset&token=\${resetToken}\`;

    const htmlContent = \`
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>🔑 Password Reset Request</h2>
        <p>Hi \${user.full_name},</p>
        <p>You recently requested to reset your password for your AgriExport ERP account. Click the button below to proceed:</p>
        <a href="\${actionLink}" style="background-color: #f5c518; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px; font-weight: bold;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">This secure link expires in 30 minutes and can only be used once.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">If you did not request a password reset, please ignore this email.</p>
      </div>
    \`;

    // Attempt 1: Resend (if configured)
    if (process.env.RESEND_API_KEY) {
      console.log('--- PASSWORD RESET EMAIL DEBUG ---');
      console.log('Attempting to send via RESEND...');
      const resendTransporter = require('nodemailer').createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY
        }
      });
      try {
        info = await resendTransporter.sendMail({
          from: 'onboarding@resend.dev',
          to: toEmail,
          subject: \`Password Reset - AgriExport ERP\`,
          html: htmlContent
        });
        console.log('Resend Success:', info);
      } catch (err) {
        console.error('Resend failed:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        primaryErr = err;
      }
    }

    // Attempt 2: Fallback to Zoho SMTP if Resend failed or wasn't configured
    if (!info) {
      console.log('Attempting to send via Fallback SMTP (Zoho)...');
      const smtpTransporter = require('nodemailer').createTransport({
        host: process.env.SMTP_HOST || 'smtp.zoho.in',
        port: process.env.SMTP_PORT || 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER || 'erp@shastikaglobal.com',
          pass: process.env.SMTP_PASS || 'default_password_here'
        }
      });
      
      try {
        info = await smtpTransporter.sendMail({
          from: process.env.SMTP_USER || 'erp@shastikaglobal.com',
          to: toEmail,
          subject: \`Password Reset - AgriExport ERP\`,
          html: htmlContent
        });
        console.log('SMTP Success:', info);
      } catch (fallbackErr) {
        console.error('SMTP Fallback failed:', JSON.stringify(fallbackErr, Object.getOwnPropertyNames(fallbackErr), 2));
        return res.status(500).json({ error: 'Failed to send email via both Resend and SMTP fallback. Please check configuration.', details: fallbackErr.message });
      }
    }
    
    return res.json({ success: true, message: 'If this email is registered, a reset link has been sent.' });`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully updated server.js with SMTP fallback logic.");
