const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    registrationNo: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
    },
    applicantName: {
      type: String,
      required: [true, 'Applicant name is required'],
      trim: true,
    },
    applicantEmail: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
    },
    semester: { type: Number, min: 1, max: 12 },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    contactInfo: {
      phone: { type: String, required: [true, 'Phone is required'] },
      alternatePhone: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
      },
    },
    guardianDetails: {
      name: { type: String, required: [true, 'Guardian name is required'] },
      phone: { type: String, required: [true, 'Guardian phone is required'] },
      relation: { type: String },
    },
    preferredRoomType: {
      type: String,
      enum: ['single', 'double', 'triple'],
      default: 'double',
    },
    preferredBlock: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    medicalInfo: {
      hasCondition: { type: Boolean, default: false },
      details: { type: String },
    },
    documents: [{ type: String }],
    termsAccepted: {
      type: Boolean,
      required: [true, 'Terms must be accepted'],
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    assignedRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    remarks: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
applicationSchema.index({ status: 1 });
applicationSchema.index({ registrationNo: 1 });
applicationSchema.index({ appliedAt: -1 });

module.exports =
  mongoose.models.Application || mongoose.model('Application', applicationSchema);
