const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    department: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: { type: Date },
    cnic: { type: String, trim: true },
    address: { type: String },
    emergencyContact: { type: String, trim: true },
    shift: {
      type: String,
      enum: ['morning', 'evening', 'night', 'general'],
      default: 'general',
    },
    assignedBlock: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    assignedTasks: [
      {
        title: { type: String, required: true },
        description: { type: String },
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending',
        },
        dueDate: { type: Date },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
    salary: { type: Number, min: 0 },
    profileImage: { type: String },
    joiningDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
staffSchema.index({ assignedBlock: 1 });
staffSchema.index({ designation: 1 });

module.exports = mongoose.models.Staff || mongoose.model('Staff', staffSchema);
