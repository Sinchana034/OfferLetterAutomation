const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const { generateStaffToken, generateCandidateToken } = require('../utils/generateToken');
const { sendPasswordResetEmail } = require('../utils/emailSender');

// @desc  Login for Admin / HR / Manager
// @route POST /api/auth/login
// @access Public
const staffLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !user.isActive || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    success: true,
    token: generateStaffToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
});

// @desc  Request password reset for Admin / HR / Manager
// @route POST /api/auth/forgot-password
// @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select('+resetPasswordToken +resetPasswordExpires');

  // Don't reveal whether the email exists.
  if (!user || !user.isActive) {
    return res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  }

  // Generate secure random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Store only the hash in MongoDB
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires in 15 minutes
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

  await user.save();

  const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const result = await sendPasswordResetEmail({
    user,
    resetLink,
  });

  if (!result.success) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(500);
    throw new Error('Unable to send password reset email');
  }

  res.json({
    success: true,
    message: 'If an account exists with that email, a password reset link has been sent.',
  });
});


// @desc  Reset staff password using reset token
// @route POST /api/auth/reset-password/:token
// @access Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!token || !password) {
    res.status(400);
    throw new Error('Reset token and new password are required');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    res.status(400);
    throw new Error('Password reset link is invalid or has expired');
  }

  user.password = password;

  // Invalidate the token after successful reset
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully. You can now sign in.',
  });
});


// @desc  Candidate sets their password using the activation link token
//        emailed to them when their offer was generated.
// @route POST /api/auth/candidate/activate
// @access Public
const activateCandidateAccount = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error('Activation token and new password are required');
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const candidate = await Candidate.findOne({
    activationToken: hashedToken,
    activationTokenExpires: { $gt: Date.now() },
  }).select('+activationToken +activationTokenExpires');

  if (!candidate) {
    res.status(400);
    throw new Error('Activation link is invalid or has expired');
  }

  candidate.password = password;
  candidate.isActivated = true;
  candidate.activationToken = undefined;
  candidate.activationTokenExpires = undefined;
  await candidate.save();

  res.json({
    success: true,
    message: 'Account activated. You can now log in.',
    token: generateCandidateToken(candidate),
  });
});

// @desc  Candidate login
// @route POST /api/auth/candidate/login
// @access Public
const candidateLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const candidate = await Candidate.findOne({ email: email.toLowerCase() }).select('+password');

  if (!candidate || !candidate.isActivated || !(await candidate.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password, or account not yet activated');
  }

  res.json({
    success: true,
    token: generateCandidateToken(candidate),
    candidate: {
      id: candidate._id,
      name: candidate.name,
      email: candidate.email,
    },
  });
});


module.exports = {
  staffLogin,
  forgotPassword,
  resetPassword,
  activateCandidateAccount,
  candidateLogin,
};
