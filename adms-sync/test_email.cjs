const nodemailer = require('nodemailer');

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: 're_RY91qXqq_7aegaE7TAxuTMcp6xsAP9nEt' // Extracted from .env
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
