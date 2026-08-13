const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Candidate = require('../models/Candidate');

// Verifies a staff JWT (admin/hr/manager) and attaches req.user
const protectStaff = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized - no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'staff') {
      res.status(401);
      throw new Error('Not authorized - invalid token type');
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('Not authorized - account not found or deactivated');
    }

    req.user = user; // { _id, name, email, role, department, ... }
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized - token invalid or expired');
  }
});

// Verifies a candidate JWT and attaches req.candidate
const protectCandidate = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized - no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'candidate') {
      res.status(401);
      throw new Error('Not authorized - invalid token type');
    }

    const candidate = await Candidate.findById(decoded.id);
    if (!candidate) {
      res.status(401);
      throw new Error('Not authorized - candidate not found');
    }

    req.candidate = candidate;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized - token invalid or expired');
  }
});

// Role gate. Usage: authorize('admin', 'hr')
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Not authorized - requires one of roles: ${allowedRoles.join(', ')}`);
    }
    next();
  };
};

// Department scope gate for Managers.
// Admin & HR bypass this entirely (they see everything).
// Manager: attaches req.departmentFilter, which controllers MUST apply
// to every query that reads/writes Offer records.
const scopeToDepartment = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'hr') {
    req.departmentFilter = {}; // no restriction
  } else if (req.user.role === 'manager') {
    if (!req.user.department) {
      res.status(403);
      throw new Error('Manager account has no department assigned');
    }
    req.departmentFilter = { department: req.user.department };
  } else {
    res.status(403);
    throw new Error('Not authorized');
  }
  next();
};

module.exports = { protectStaff, protectCandidate, authorize, scopeToDepartment };
