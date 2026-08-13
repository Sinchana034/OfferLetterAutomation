const express = require('express');
const router = express.Router();
const { protectCandidate } = require('../middleware/auth');
const { getMyProfile, updateMyProfile } = require('../controllers/candidateController');

router.use(protectCandidate);

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);

module.exports = router;
