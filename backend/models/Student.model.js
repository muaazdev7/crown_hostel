const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Registration/Roll number is required'],
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    year: { type: Number, min: 1, max: 6 },
    semester: { type: Number, min: 1, max: 12 },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    dateOfBirth: { type: Date },
    cnic: { type: String, trim: true },
    nationality: { type: String, trim: true },
    bloodGroup: { type: String },
    program: { type: String, trim: true },
    session: { type: String, trim: true },
    batch: { type: String, trim: true },
    cgpa: { type: Number, min: 0, max: 4 },
    academicStatus: {
      type: String,
      enum: ['regular', 'probation', 'suspended', 'graduated', 'withdrawn'],
      default: 'regular',
    },
    contactInfo: {
      phone: { type: String },
      alternatePhone: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
      },
    },
    guardianDetails: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      relation: { type: String },
    },
    profileImage: { type: String },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    status: {
      type: String,
      enum: ['active', 'checked_out', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Indexes for dashboard and filtering
studentSchema.index({ department: 1, status: 1 });
studentSchema.index({ room: 1 });
studentSchema.index({ block: 1 });

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);
