const asyncHandler = require('express-async-handler');
const Offer = require('../models/Offer');
const Candidate = require('../models/Candidate');
const { generateOfferPdf } = require('../utils/pdfGenerator');
const { sendOfferEmail } = require('../utils/emailSender');
const { generateActivationToken } = require('../utils/generateToken');
const { DEPARTMENTS, EMPLOYMENT_TYPES, INTERNSHIP_DURATIONS } = require('../config/constants');
const { upsertOfferRow } = require('../utils/googleSheets');


const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + Number(months));
  return d;
};
// @desc  Generate a new offer letter: create record -> render PDF ->
//        provision candidate portal account -> email PDF + activation link
// @route POST /api/offers/generate
// @access Admin, HR only

const generateOffer = asyncHandler(async (req, res) => {
  const {
    candidateName,
    candidateEmail,
    designation,
    department,
    employmentType,
    internshipDurationMonths,
    dateOfJoining,
    stipendOrCTC,
    reportingManager,
  } = req.body;

  if (!candidateName || !candidateEmail || !designation || !department || !dateOfJoining || !stipendOrCTC) {
    res.status(400);
    throw new Error('Missing required offer fields');
  }
  if (!DEPARTMENTS.includes(department)) {
    res.status(400);
    throw new Error('Invalid department');
  }
  if (!EMPLOYMENT_TYPES.includes(employmentType)) {
    res.status(400);
    throw new Error('Employment type must be "Internship" or "Full-time"');
  }
  if (employmentType === 'Internship' && !INTERNSHIP_DURATIONS.includes(Number(internshipDurationMonths))) {
    res.status(400);
    throw new Error('Duration must be 3, 6, or 9 months for an internship');
  }

  const existing = await Candidate.findOne({ email: candidateEmail.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('A candidate with this email already has an offer/account');
  }

  const endDate =
    employmentType === 'Internship' ? addMonths(dateOfJoining, internshipDurationMonths) : null;

  const offer = await Offer.create({
    candidateName,
    candidateEmail: candidateEmail.toLowerCase(),
    designation,
    department,
    employmentType,
    internshipDurationMonths: employmentType === 'Internship' ? Number(internshipDurationMonths) : null,
    dateOfJoining,
    endDate,
    stipendOrCTC,
    reportingManager,
    generatedBy: req.user._id,
    emailStatus: 'Pending',
  });

  // 2. Render the PDF (async, doesn't block on failure below - we still
  //    want the offer record to exist even if PDF/email fails, so it
  //    shows up as "Failed" and can be retried from the dashboard)
  let pdfPath;
  try {
    pdfPath = await generateOfferPdf(offer);
    offer.pdfUrl = `/generated-pdfs/offer-${offer._id}.pdf`;
    await offer.save();
  } catch (err) {
    offer.emailStatus = 'Failed';
    offer.emailError = `PDF generation failed: ${err.message}`;
    await offer.save();
    return res.status(201).json({
      success: true,
      offer,
      warning: 'Offer created but PDF generation failed. Use retry from the dashboard.',
    });
  }

  // 3. Provision the candidate portal account (inactive until they set a password)
  const { rawToken, hashedToken } = generateActivationToken();
  const candidate = await Candidate.create({
    name: candidateName,
    email: candidateEmail.toLowerCase(),
    password: rawToken, // placeholder hashed password until they activate; unusable to log in as-is
    offer: offer._id,
    activationToken: hashedToken,
    activationTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  offer.candidateAccountCreated = true;
  await offer.save();

  // 4. Send the email with PDF attached + activation link
  const activationLink = `${process.env.CANDIDATE_PORTAL_URL}?token=${rawToken}`;
  const result = await sendOfferEmail({ offer, pdfPath, activationLink });

  offer.emailAttempts += 1;
  if (result.success) {
    offer.emailStatus = 'Sent';
    offer.emailError = null;
  } else {
    offer.emailStatus = 'Failed';
    offer.emailError = result.error;
  }
  await offer.save();

  // 5. Best-effort sync to Google Sheets (one tab per department).
  //    Never blocks or fails the offer if the spreadsheet is unreachable.
  const sheetResult = await upsertOfferRow(offer, req.user.name);
  offer.sheetSyncStatus = sheetResult.success ? 'Synced' : 'Failed';
  offer.sheetSyncError = sheetResult.success ? null : sheetResult.error;
  await offer.save();

  res.status(201).json({ success: true, offer, candidateId: candidate._id });
});

// @desc  Retry sending an offer email - optionally with edited fields.
//        Body may be empty (resend as-is) or contain any subset of
//        editable fields (edit-then-resend). candidateEmail is
//        intentionally NOT editable here since it's the candidate's
//        portal login - changing it would orphan their account.
// @route POST /api/offers/:id/resend
// @access Admin, HR only
const resendOffer = asyncHandler(async (req, res) => {
  console.log('=== RESEND START ===');
  console.log('Offer ID:', req.params.id);

  const offer = await Offer.findOne({
    _id: req.params.id,
    ...req.departmentFilter,
  });

  if (!offer) {
    console.log('Offer not found');
    res.status(404);
    throw new Error('Offer not found');
  }

  console.log('Offer found:', offer._id);
  console.log('Candidate:', offer.candidateName);
  console.log('Email:', offer.candidateEmail);

  const {
    candidateName,
    designation,
    department,
    employmentType,
    internshipDurationMonths,
    dateOfJoining,
    stipendOrCTC,
    reportingManager,
  } = req.body || {};

  const hasEdits = Object.keys(req.body || {}).length > 0;

  console.log('Has edits:', hasEdits);

  if (hasEdits) {
    if (candidateName) offer.candidateName = candidateName;
    if (designation) offer.designation = designation;
    if (dateOfJoining) offer.dateOfJoining = dateOfJoining;
    if (stipendOrCTC) offer.stipendOrCTC = stipendOrCTC;
    if (reportingManager !== undefined) {
      offer.reportingManager = reportingManager;
    }

    if (department) {
      if (!DEPARTMENTS.includes(department)) {
        res.status(400);
        throw new Error(
          `Department must be one of: ${DEPARTMENTS.join(', ')}`
        );
      }

      offer.department = department;
    }

    if (employmentType) {
      if (!EMPLOYMENT_TYPES.includes(employmentType)) {
        res.status(400);
        throw new Error(
          `Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}`
        );
      }

      offer.employmentType = employmentType;
    }

    if (offer.employmentType === 'Internship') {
      const duration = internshipDurationMonths
        ? Number(internshipDurationMonths)
        : offer.internshipDurationMonths;

      if (!INTERNSHIP_DURATIONS.includes(duration)) {
        res.status(400);
        throw new Error(
          `Internship duration must be one of: ${INTERNSHIP_DURATIONS.join(', ')} months`
        );
      }

      offer.internshipDurationMonths = duration;
      offer.endDate = addMonths(offer.dateOfJoining, duration);
    } else {
      offer.internshipDurationMonths = null;
      offer.endDate = null;
    }

    await offer.save();

    console.log('Offer edits saved');
  }

  // =========================
  // PDF GENERATION
  // =========================

  let pdfPath;

  try {
    console.log('STEP 1: Starting PDF generation');

    pdfPath = await generateOfferPdf(offer);

    console.log('STEP 2: PDF generated');
    console.log('PDF path:', pdfPath);

    offer.pdfUrl = `/generated-pdfs/offer-${offer._id}.pdf`;
  } catch (err) {
    console.error('STEP PDF FAILED');
    console.error('PDF error:', err);
    console.error('PDF error message:', err.message);
    console.error('PDF error stack:', err.stack);

    offer.emailStatus = 'Failed';
    offer.emailError = `PDF generation failed: ${err.message}`;

    await offer.save();

    res.status(500);
    throw new Error(`PDF regeneration failed: ${err.message}`);
  }

  // =========================
  // CANDIDATE
  // =========================

  console.log('STEP 3: Finding candidate');

  const candidate = await Candidate.findOne({
    offer: offer._id,
  }).select('+activationToken');

  console.log(
    'Candidate found:',
    candidate ? candidate._id : 'NO CANDIDATE'
  );

  let activationLink = `${process.env.CANDIDATE_PORTAL_URL}`;

  if (candidate && !candidate.isActivated) {
    console.log('STEP 4: Generating activation token');

    const { rawToken, hashedToken } = generateActivationToken();

    candidate.activationToken = hashedToken;
    candidate.activationTokenExpires =
      Date.now() + 7 * 24 * 60 * 60 * 1000;

    await candidate.save();

    activationLink =
      `${process.env.CANDIDATE_PORTAL_URL}?token=${rawToken}`;

    console.log('Activation token generated');
  }

  // =========================
  // EMAIL
  // =========================

  console.log('STEP 5: Sending email');

  const result = await sendOfferEmail({
    offer,
    pdfPath,
    activationLink,
  });

  console.log('STEP 6: Email result:', result);

  offer.emailAttempts += 1;
  offer.emailStatus = result.success ? 'Sent' : 'Failed';
  offer.emailError = result.success ? null : result.error;

  await offer.save();

  // =========================
  // GOOGLE SHEETS
  // =========================

  console.log('STEP 7: Updating Google Sheet');

  const sheetResult = await upsertOfferRow(
    offer,
    req.user.name
  );

  console.log('STEP 8: Google Sheet result:', sheetResult);

  offer.sheetSyncStatus = sheetResult.success
    ? 'Synced'
    : 'Failed';

  offer.sheetSyncError = sheetResult.success
    ? null
    : sheetResult.error;

  await offer.save();

  console.log('=== RESEND SUCCESS ===');

  res.json({
    success: true,
    offer,
  });
});

// @desc  List offers - Admin/HR see all, Manager sees only their department
// @route GET /api/offers?search=&status=&department=&page=&limit=
// @access Admin, HR, Manager
const getOffers = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;

  const query = { ...req.departmentFilter }; // {} for admin/hr, {department: X} for manager

  if (status) query.emailStatus = status;
  if (search) {
    query.$or = [
      { candidateName: { $regex: search, $options: 'i' } },
      { candidateEmail: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [offers, total] = await Promise.all([
    Offer.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Offer.countDocuments(query),
  ]);

  res.json({
    success: true,
    offers,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// @desc  Get single offer by id (department-scoped for managers)
// @route GET /api/offers/:id
// @access Admin, HR, Manager
const getOfferById = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({ _id: req.params.id, ...req.departmentFilter });
  if (!offer) {
    res.status(404);
    throw new Error('Offer not found');
  }
  

  res.json({ success: true, offer });
});

// @desc  Get dashboard statistics
// @route GET /api/offers/stats
// @access Admin, HR
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalCandidates,
    selectedCandidates,
    offersGenerated,
    emailsSent,
    pendingEmails,
    failedEmails,
  ] = await Promise.all([
    Candidate.countDocuments(),

    Candidate.countDocuments({
      status: 'Selected',
    }),

    Offer.countDocuments(),

    Offer.countDocuments({
      emailStatus: 'Sent',
    }),

    Offer.countDocuments({
      emailStatus: 'Pending',
    }),

    Offer.countDocuments({
      emailStatus: 'Failed',
    }),
  ]);

  res.json({
    success: true,
    stats: {
      totalCandidates,
      selectedCandidates,
      offersGenerated,
      emailsSent,
      pendingEmails,
      failedEmails,
    },
  });
});
module.exports = {
  generateOffer,
  resendOffer,
  getOffers,
  getOfferById,
  getDashboardStats,
};
