const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { DEPARTMENTS } = require('../config/constants');

// @desc  Create a new staff account (HR or Manager). Admin accounts
//        should be created via the seed script, not this endpoint,
//        to avoid privilege-escalation via the API.
// @route POST /api/users
// @access Admin only


const createStaffUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (role === 'manager') {
    if (!department) {
      res.status(400);
      throw new Error('Department is required for manager accounts');
    }
    if (!DEPARTMENTS.includes(department)) {
      res.status(400);
      throw new Error(`Department must be one of: ${DEPARTMENTS.join(', ')}`);
    }
  }

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Name, email, password, and role are required');
  }
  if (!['hr', 'manager'].includes(role)) {
    res.status(400);
    throw new Error('Role must be either "hr" or "manager"');
  }
  if (role === 'manager' && !department) {
    res.status(400);
    throw new Error('Department is required for manager accounts');
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
    department: role === 'manager' ? department : null,
  });

  res.status(201).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department },
  });
});

// @desc  List all staff accounts
// @route GET /api/users
// @access Admin only
const getStaffUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users });
});

// @desc  Activate/deactivate a staff account
// @route PATCH /api/users/:id/status
// @access Admin only
const setStaffUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot deactivate an admin account through this endpoint');
  }
  user.isActive = Boolean(isActive);
  await user.save();
  res.json({ success: true, user: { id: user._id, isActive: user.isActive } });
});

// @desc  List active managers (name + department only) - used to populate
//        the "Reporting Manager" dropdown when generating/editing an offer.
//        Deliberately lighter than getStaffUsers and open to HR too, since
//        HR needs this to fill the form, not just Admin.
// @route GET /api/users/managers
// @access Admin, HR
const getManagersForOffers = asyncHandler(async (req, res) => {
  const managers = await User.find({ role: 'manager', isActive: true })
    .select('name department')
    .sort({ department: 1, name: 1 });
  res.json({ success: true, managers });
});

module.exports = { createStaffUser, getStaffUsers, setStaffUserStatus, getManagersForOffers };


