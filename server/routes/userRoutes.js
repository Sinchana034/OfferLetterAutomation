const express = require('express');
const router = express.Router();
const { protectStaff, authorize } = require('../middleware/auth');
const {
  createStaffUser,
  getStaffUsers,
  setStaffUserStatus,
  getManagersForOffers,
} = require('../controllers/userController');

router.use(protectStaff);

// Open to HR as well as Admin - HR needs this to populate the
// "Reporting Manager" dropdown on the offer form.
router.get('/managers', authorize('admin', 'hr'), getManagersForOffers);

// Everything else (creating/listing/deactivating staff accounts)
// stays Admin-only.
router.use(authorize('admin'));

router.post('/', createStaffUser);
router.get('/', getStaffUsers);
router.patch('/:id/status', setStaffUserStatus);

module.exports = router;