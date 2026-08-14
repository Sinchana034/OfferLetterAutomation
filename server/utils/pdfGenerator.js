const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'offerLetter.html');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated-pdfs');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

// Replaces {{placeholder}} tokens in the template with real offer data.
const buildHtml = (offer) => {
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  const isInternship = offer.employmentType === 'Internship';

  const values = {
    companyName: process.env.COMPANY_NAME || 'RGT-vertex',
    companyLogoUrl: process.env.COMPANY_LOGO_URL || '',
    companyAddress: process.env.COMPANY_ADDRESS || '',
    candidateName: offer.candidateName,
    designation: offer.designation,
    department: offer.department,
    employmentType: offer.employmentType || 'Internship',
    employmentTypeLabel: isInternship
      ? `Internship (${offer.internshipDurationMonths} month${offer.internshipDurationMonths === 1 ? '' : 's'})`
      : 'Full-time',
    engagementNoun: isInternship ? 'internship engagement' : 'employment',
    dateOfJoining: formatDate(offer.dateOfJoining),
    stipendOrCTC: offer.stipendOrCTC,
    reportingManager: offer.reportingManager || 'N/A',
    offerIssueDate: formatDate(offer.offerIssueDate || Date.now()),
  };

  for (const [key, val] of Object.entries(values)) {
    const safeVal = String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replaceAll(`{{${key}}}`, safeVal);
  }

  const endDateRow =
    isInternship && offer.endDate
      ? `<tr><td>Internship End Date</td><td>${formatDate(offer.endDate)}</td></tr>`
      : '';
  html = html.replace('{{endDateRow}}', endDateRow);

  return html;
};

// Renders the offer to a PDF file on disk and returns the file path.
// `offer` must be a plain object (or Mongoose doc) with the fields
// used in buildHtml() above.
const generateOfferPdf = async (offer) => {
  const html = buildHtml(offer);
  const fileName = `offer-${offer._id}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  console.log(`Generating PDF for offer ${offer._id}...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
      },
    });

    console.log(`PDF generated successfully: ${filePath}`);
  } catch (error) {
    console.error('PDF GENERATION ERROR:', error);
    console.error('PDF ERROR MESSAGE:', error.message);
    console.error('PDF ERROR STACK:', error.stack);
    throw error;
  } finally {
    await browser.close();
  }

  return filePath;
};

module.exports = { generateOfferPdf, OUTPUT_DIR };
