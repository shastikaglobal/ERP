import nodemailer from 'nodemailer';

async function testSmtp() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'bde@shastikaglobalimpexpvtltd.co.in',
      pass: 'H2G0wjdcvUGh',
    },
  });

  try {
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("Connection successful!");
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

testSmtp();
