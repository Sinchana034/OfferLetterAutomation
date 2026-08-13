const asyncHandler = require('express-async-handler');
const Candidate = require('../models/Candidate');

// @desc  Get the logged-in candidate's own offer + profile
// @route GET /api/candidate/me
// @access Candidate
const getMyProfile = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.candidate._id).populate('offer');
  res.json({
    success: true,
    candidate: {
      id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      profile: candidate.profile,
      offer: candidate.offer, // includes pdfUrl, designation, DOJ, status, etc.
    },
  });
});

// @desc  Update only the editable, non-legal profile fields.
//        Name/designation/CTC/DOJ are intentionally NOT editable here -
//        those live on the Offer record and are HR/Admin-owned.
// @route PATCH /api/candidate/me
// @access Candidate
const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['phone', 'address', 'emergencyContactName', 'emergencyContactPhone'];
  const candidate = await Candidate.findById(req.candidate._id);

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      candidate.profile[field] = req.body[field];
    }
  }

  await candidate.save();
  res.json({ success: true, profile: candidate.profile });
});

module.exports = { getMyProfile, updateMyProfile };
