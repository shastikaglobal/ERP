const fs = require('fs');

let c = fs.readFileSync('adms-sync/server.js', 'utf8');

const target = `    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.zoho.in',
      port: process.env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'erp@shastikaglobal.com',
        pass: process.env.SMTP_PASS || 'default_password_here'
      }
    });`;

const replacement = `    // Determine SMTP configuration (Prefer Resend API key if available)
    const isResend = !!process.env.RESEND_API_KEY;
    const transporter = nodemailer.createTransport({
      host: isResend ? 'smtp.resend.com' : (process.env.SMTP_HOST || 'smtp.zoho.in'),
      port: isResend ? 465 : (process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: isResend ? 'resend' : (process.env.SMTP_USER || 'erp@shastikaglobal.com'),
        pass: isResend ? process.env.RESEND_API_KEY : (process.env.SMTP_PASS || 'default_password_here')
      }
    });`;

c = c.replace(target, replacement);

fs.writeFileSync('adms-sync/server.js', c);
