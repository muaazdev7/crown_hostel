const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    fromDate: {
      type: Date,
      required: [true, 'From date is required'],
    },
    toDate: {
      type: Date,
      required: [true, 'To date is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    leaveType: {
      type: String,
      enum: ['home_visit', 'medical', 'personal', 'emergency', 'academic'],
    },
    destination: { type: String },
    contactDuring: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// Indexes
leaveSchema.index({ student: 1, status: 1 });
leaveSchema.index({ fromDate: 1, toDate: 1 });

// Validation: toDate must be after fromDate
leaveSchema.pre('save', function (next) {
  if (this.toDate <= this.fromDate) {
    return next(new Error('To date must be after from date'));
  }
  next();
});

module.exports = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);
