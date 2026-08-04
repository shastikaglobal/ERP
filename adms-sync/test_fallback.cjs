require('dotenv').config({ path: '../.env' });
const nodemailer = require('nodemailer');

async function testFallback() {
  const toEmail = 'kim.swathi.07@gmail.com';
  let info = null;
  let primaryErr = null;
  
  // Attempt 1: Resend
  if (process.env.RESEND_API_KEY) {
    console.log('--- PASSWORD RESET EMAIL DEBUG ---');
    console.log('Attempting to send via RESEND...');
    const resendTransporter = nodemailer.createTransport({
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
        subject: `Password Reset - AgriExport ERP`,
        html: '<p>Test Fallback</p>'
      });
      console.log('Resend Success:', info);
    } catch (err) {
      console.error('Resend failed:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      primaryErr = err;
    }
  }

  // Attempt 2: Fallback
  if (!info) {
    console.log('Attempting to send via Fallback SMTP (Zoho)...');
    const smtpTransporter = nodemailer.createTransport({
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
        subject: `Password Reset - AgriExport ERP`,
        html: '<p>Test Fallback SMTP</p>'
      });
      console.log('SMTP Success:', info);
    } catch (fallbackErr) {
      console.error('SMTP Fallback failed:', JSON.stringify(fallbackErr, Object.getOwnPropertyNames(fallbackErr), 2));
    }
  }
}

testFallback();
