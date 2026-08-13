const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Staff token carries role + department so middleware/controllers
// can make authorization decisions without an extra DB round trip.
const generateStaffToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      department: user.department || null,
      type: 'staff',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const generateCandidateToken = (candidate) => {
  return jwt.sign(
    { id: candidate._id, type: 'candidate' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.CANDIDATE_JWT_EXPIRES_IN || '30d' }
  );
};

// Random token used for the one-time "activate your portal account" link
// emailed to candidates. Not a JWT - stored (hashed) with an expiry
// so it can be single-use and revocable.
const generateActivationToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
};

module.exports = { generateStaffToken, generateCandidateToken, generateActivationToken };
