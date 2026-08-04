const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY
    }
  });
  try {
    const info = await transporter.sendMail({
      from: 'onboarding@resend.dev',
      to: 'kim.swathi.07@gmail.com',
      subject: 'Test Resend Sandbox',
      html: '<p>Test</p>'
    });
    console.log('Success:', info);
  } catch (err) {
    console.error('--- ERROR CAUGHT ---');
    console.error(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
  }
}

test();