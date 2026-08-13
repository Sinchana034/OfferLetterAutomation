const nodemailer = require('nodemailer');

// Single shared transporter, built from env vars.
// Works with Gmail SMTP, SendGrid SMTP relay, Amazon SES SMTP, Mailgun, etc.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587/25
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on boot (non-fatal - just logs a warning)
transporter.verify((error) => {
  if (error) {
    console.warn('SMTP transporter verification failed:', error.message);
  } else {
    console.log('SMTP transporter ready to send emails');
  }
});

module.exports = transporter;
