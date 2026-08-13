const express = require('express');
const router = express.Router();
const { protectStaff, authorize, scopeToDepartment } = require('../middleware/auth');
const {
  generateOffer,
  resendOffer,
  getOffers,
  getOfferById,
  getDashboardStats,
} = require('../controllers/offerController');


// All offer routes require a logged-in staff member.
router.use(protectStaff);

router.get('/stats', authorize('admin', 'hr'), getDashboardStats);

// Only Admin & HR can generate/resend letters.
router.post('/generate', authorize('admin', 'hr'), generateOffer);
router.post('/:id/resend', authorize('admin', 'hr'), resendOffer);

// Admin, HR, and Manager can all read - but scopeToDepartment ensures
// a Manager's queries are automatically filtered to their department.
router.get('/', authorize('admin', 'hr', 'manager'), scopeToDepartment, getOffers);
router.get('/:id', authorize('admin', 'hr', 'manager'), scopeToDepartment, getOfferById);

module.exports = router;
