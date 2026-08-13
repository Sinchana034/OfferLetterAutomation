const mongoose = require('mongoose');
const { DEPARTMENTS, EMPLOYMENT_TYPES, INTERNSHIP_DURATIONS } = require('../config/constants');

const offerSchema = new mongoose.Schema(
  {
    candidateName: { type: String, required: true, trim: true },
    candidateEmail: { type: String, required: true, lowercase: true, trim: true },
    designation: { type: String, required: true, trim: true },

    // This is the field Manager-scoping filters on everywhere.
    // Keep it a plain string for now (matches the doc's schema);
    // swap to a ref('Department') collection later if departments
    // need their own metadata (head, code, etc.)
    department: { type: String, required: true, trim: true, index: true, enum: DEPARTMENTS },

    employmentType: { type: String, required: true, enum: EMPLOYMENT_TYPES, default: 'Internship' },

    internshipDurationMonths: {
      type: Number,
      enum: INTERNSHIP_DURATIONS,
      default: null,
    },

    dateOfJoining: { type: Date, required: true },

    endDate: { type: Date, default: null },
    
    stipendOrCTC: { type: String, required: true },
    reportingManager: { type: String, trim: true },
    offerIssueDate: { type: Date, default: Date.now },

    pdfUrl: { type: String, default: null },

    emailStatus: {
      type: String,
      enum: ['Pending', 'Sent', 'Failed'],
      default: 'Pending',
    },
    emailError: { type: String, default: null }, // last failure reason, for retry/debug
    emailAttempts: { type: Number, default: 0 },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Whether the candidate account was successfully provisioned
    // (candidate portal login). Kept separate from emailStatus since
    // letter delivery and account creation can fail independently.
    candidateAccountCreated: { type: Boolean, default: false },

    // Best-effort sync to the Google Sheet (one tab per department).
    // Never blocks or fails the offer itself - see utils/googleSheets.js.
    sheetSyncStatus: {
      type: String,
      enum: ['Not configured', 'Synced', 'Failed'],
      default: 'Not configured',
    },
    sheetSyncError: { type: String, default: null },
  },
  
  { timestamps: true }
);

offerSchema.pre('validate', function (next) {
  if (this.employmentType === 'Internship' && !this.internshipDurationMonths) {
    this.invalidate('internshipDurationMonths', 'Duration is required for internship offers');
  }
  if (this.employmentType === 'Full-time') {
    this.internshipDurationMonths = null;
    this.endDate = null;
  }
  next();
});

offerSchema.index({ candidateName: 'text', candidateEmail: 'text' });

module.exports = mongoose.model('Offer', offerSchema);
