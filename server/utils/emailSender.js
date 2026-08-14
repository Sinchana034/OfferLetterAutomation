const fs = require('fs');
const dns = require('dns').promises;
const { google } = require('googleapis');

// --------------------------------------------------
// Gmail API configuration
// --------------------------------------------------

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: 'v1',
  auth: oauth2Client,
});

// --------------------------------------------------
// Check whether recipient domain has a valid MX record
// --------------------------------------------------

const hasValidMxRecord = async (email) => {
  const domain = email.split('@')[1];

  if (!domain) return false;

  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
};

// --------------------------------------------------
// Convert string to base64url
// Gmail API requires base64url encoded messages
// --------------------------------------------------

const toBase64Url = (input) => {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// --------------------------------------------------
// Send email through Gmail API
// --------------------------------------------------

const sendGmailMessage = async ({
  to,
  subject,
  html,
  pdfPath,
  pdfFilename,
}) => {
  const from = process.env.GMAIL_USER;

  const boundary = `----=_Boundary_${Date.now()}`;

  let message = '';

  message += `From: ${from}\r\n`;
  message += `To: ${to}\r\n`;
  message += `Subject: ${subject}\r\n`;
  message += `MIME-Version: 1.0\r\n`;
  message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
  message += `\r\n`;

  // HTML body
  message += `--${boundary}\r\n`;
  message += `Content-Type: text/html; charset="UTF-8"\r\n`;
  message += `Content-Transfer-Encoding: base64\r\n`;
  message += `\r\n`;
  message += Buffer.from(html, 'utf8')
    .toString('base64')
    .match(/.{1,76}/g)
    .join('\r\n');

  message += `\r\n\r\n`;

  // PDF attachment
  if (pdfPath) {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer
      .toString('base64')
      .match(/.{1,76}/g)
      .join('\r\n');

    message += `--${boundary}\r\n`;
    message += `Content-Type: application/pdf; name="${pdfFilename}"\r\n`;
    message += `Content-Disposition: attachment; filename="${pdfFilename}"\r\n`;
    message += `Content-Transfer-Encoding: base64\r\n`;
    message += `\r\n`;
    message += pdfBase64;
    message += `\r\n\r\n`;
  }

  message += `--${boundary}--`;

  const encodedMessage = toBase64Url(message);

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
};

// --------------------------------------------------
// Send Offer Letter
// --------------------------------------------------

const sendOfferEmail = async ({
  offer,
  pdfPath,
  activationLink,
}) => {
  const companyName =
    process.env.COMPANY_NAME || 'RGT-vertex';

  const domainIsValid = await hasValidMxRecord(
    offer.candidateEmail
  );

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
        position of <strong>${offer.designation}</strong> at
        <strong>${companyName}</strong>.
        Please find the offer letter attached as a PDF.
      </p>

      <p>
        To view your offer online, track its status, and update your contact details,
        please activate your candidate portal account using the link below:
      </p>

      <p>
        <a href="${activationLink}"
           style="background:#1d4ed8;color:#fff;padding:10px 18px;
           border-radius:6px;text-decoration:none;display:inline-block;">
          Activate Your Candidate Portal
        </a>
      </p>

      <p>This link will expire in 7 days.</p>

      <p>
        We look forward to welcoming you to the team.
      </p>

      <p>
        Warm regards,<br/>
        HR Team<br/>
        ${companyName}
      </p>

    </div>
  `;

  try {
    const filename =
      `Offer_Letter_${offer.candidateName.replace(/\s+/g, '_')}.pdf`;

    await sendGmailMessage({
      to: offer.candidateEmail,
      subject: `Your Internship Offer Letter - ${companyName}`,
      html,
      pdfPath,
      pdfFilename: filename,
    });

    return {
      success: true,
    };

  } catch (error) {
    console.error('Gmail API send error:', error);

    return {
      success: false,
      error: error.message,
    };
  }
};

// --------------------------------------------------
// Send Password Reset Email
// --------------------------------------------------

const sendPasswordResetEmail = async ({
  user,
  resetLink,
}) => {
  const companyName =
    process.env.COMPANY_NAME || 'RGT-vertex';

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

      <p>
        This password reset link will expire in 15 minutes.
      </p>

      <p>
        If you did not request this password reset,
        you can safely ignore this email.
      </p>

      <p>
        Warm regards,<br/>
        HR Team<br/>
        ${companyName}
      </p>

    </div>
  `;

  try {
    await sendGmailMessage({
      to: user.email,
      subject: `Reset Your Offer Desk Password - ${companyName}`,
      html,
    });

    return {
      success: true,
    };

  } catch (error) {
    console.error('Gmail API password reset error:', error);

    return {
      success: false,
      error: error.message,
    };
  }
};

// --------------------------------------------------
// Exports
// --------------------------------------------------

module.exports = {
  sendOfferEmail,
  sendPasswordResetEmail,
};