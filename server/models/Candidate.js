const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Candidate accounts are created automatically the moment an offer
// letter is generated for them (see offerController.generateOffer).
// They can only ever see/edit their OWN record - enforced in
// candidateController + auth middleware, not here.
const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    // Set to false until the candidate completes their password-set flow
    // via the link emailed to them (see authController.setCandidatePassword)
    isActivated: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Applied', 'Selected', 'Rejected'],
      default: 'Selected',
    },
    activationToken: {
      type: String,
      select: false,
    },
    activationTokenExpires: {
      type: Date,
      select: false,
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
    },
    // Editable, non-legal profile fields only.
    // Name/designation/CTC/DOJ live on the Offer record and are locked.
    profile: {
      phone: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
      emergencyContactName: { type: String, trim: true, default: '' },
      emergencyContactPhone: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true }
);

candidateSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

candidateSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Candidate', candidateSchema);
