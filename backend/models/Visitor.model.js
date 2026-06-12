const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    visitingStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: false,
    },
    relation: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      trim: true,
    },
    idType: {
      type: String,
      trim: true,
    },
    idNumber: {
      type: String,
      trim: true,
    },
    checkIn: {
      type: Date,
      default: Date.now,
    },
    checkOut: {
      type: Date,
      required: false,
    },
    // Approval workflow — managed by Wardens only
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, trim: true },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    approvedAt: { type: Date },
  },
  { timestamps: true } // createdAt & updatedAt
);

// Indexes for faster queries
visitorSchema.index({ visitingStudent: 1 });
visitorSchema.index({ checkIn: -1 });
visitorSchema.index({ status: 1, createdAt: -1 });

// Prevent OverwriteModelError on hot reload / nodemon
module.exports =
  mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);