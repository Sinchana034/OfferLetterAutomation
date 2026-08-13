const fs = require('fs');
const dns = require('dns').promises;
const transporter = require('../config/mailer');

// Checks whether the recipient's domain has a valid mail server (MX record)
// before we even attempt to send. This catches typo'd/fake domains
// (e.g. "gmial.com") immediately.
//
// IMPORTANT LIMITATION: this cannot catch a fake mailbox on a real domain
// (e.g. a made-up address at gmail.com) - SMTP accepting a message only
// means the mail server agreed to try delivery, not that the mailbox
// exists. Real bounces happen asynchronously and require a provider
// webhook (SendGrid Event Webhook, SES + SNS, etc.) to detect - that's a
// separate integration, not something this MX check can do.
const hasValidMxRecord = async (email) => {
  const domain = email.split('@')[1];
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false; // domain doesn't exist or has no mail server
  }
};

// Sends the offer letter PDF + candidate portal activation link.
// Returns { success: boolean, error?: string }
const sendOfferEmail = async ({ offer, pdfPath, activationLink }) => {
  const companyName = process.env.COMPANY_NAME || 'RGT-vertex';

  const domainIsValid = await hasValidMxRecord(offer.candidateEmail);
  if (!domainIsValid) {
    return {
      success: false,
      error: `The domain in "${offer.candidateEmail}" doesn't have a valid mail server - this email address can't receive mail.`,
    };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #222; line-height: 1.6;">
      <p>Dear ${offer.candidateName},</p>
      <p>
        Congratulations! We are pleased to share your internship offer letter for the
        position of <strong>${offer.designation}</strong> at <strong>${companyName}</strong>.
        Please find the offer letter attached as a PDF.
      </p>
      <p>
        To view your offer online, track its status, and update your contact details,
        please activate your candidate portal account using the link below:
      </p>
      <p>
        <a href="${activationLink}" style="background:#1d4ed8;color:#fff;padding:10px 18px;
           border-radius:6px;text-decoration:none;display:inline-block;">
          Activate Your Candidate Portal
        </a>
      </p>
      <p>This link will expire in 7 days.</p>
      <p>We look forward to welcoming you to the team.</p>
      <p>Warm regards,<br/>HR Team<br/>${companyName}</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: offer.candidateEmail,
      subject: `Your Internship Offer Letter - ${companyName}`,
      html,
      attachments: [
        {
          filename: `Offer_Letter_${offer.candidateName.replace(/\s+/g, '_')}.pdf`,
          content: fs.readFileSync(pdfPath),
          contentType: 'application/pdf',
        },
      ],
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


// Sends a password reset link to staff
const sendPasswordResetEmail = async ({ user, resetLink }) => {
  const companyName = process.env.COMPANY_NAME || 'RGT-vertex';

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #222; line-height: 1.6;">
      <p>Hello ${user.name},</p>

      <p>
        We received a request to reset the password for your
        <strong>Offer Desk</strong> account.
      </p>

      <p>
        <a href="${resetLink}"
           style="background:#1d4ed8;color:#fff;padding:10px 18px;
           border-radius:6px;text-decoration:none;display:inline-block;">
          Reset Your Password
        </a>
      </p>

      <p>This password reset link will expire in 15 minutes.</p>

      <p>
        If you did not request a password reset, you can safely ignore this email.
      </p>

      <p>
        Warm regards,<br/>
        HR Team<br/>
        ${companyName}
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `Reset Your Offer Desk Password - ${companyName}`,
      html,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
module.exports = {
  sendOfferEmail,
  sendPasswordResetEmail,
};