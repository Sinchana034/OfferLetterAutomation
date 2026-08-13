const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { DEPARTMENTS } = require('../config/constants');

// Covers Admin, HR, and Manager — all "internal staff" accounts.
// Candidates are a separate model (see Candidate.js) since they
// have a completely different, much narrower permission set.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: ['admin', 'hr', 'manager'],
      required: true,
      default: 'hr',
    },
    department: {
      type: String,
      trim: true,
      enum: { values: [...DEPARTMENTS, null], message: '{VALUE} is not a valid department' },
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Enforce: managers MUST have a department; admin/hr should not need one.
userSchema.pre('validate', function (next) {
  if (this.role === 'manager' && !this.department) {
    this.invalidate('department', 'Department is required for manager accounts');
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
