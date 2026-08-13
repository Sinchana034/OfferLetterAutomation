const express = require('express');
const router = express.Router();
const {
  staffLogin,
  forgotPassword,
  resetPassword,
  activateCandidateAccount,
  candidateLogin,
} = require('../controllers/authController');

router.post('/login', staffLogin); // Admin / HR / Manager
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.post('/candidate/activate', activateCandidateAccount);
router.post('/candidate/login', candidateLogin);

module.exports = router;
