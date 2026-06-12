const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Ensures one Admin per User
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    designation: {
      type: String,
      default: 'Hostel Administrator',
      trim: true, // Optional: remove extra spaces
    },
    permissions: {
      manageStudents: { type: Boolean, default: true },
      manageStaff: { type: Boolean, default: true },
      manageRooms: { type: Boolean, default: true },
      manageFees: { type: Boolean, default: true },
      manageComplaints: { type: Boolean, default: true },
      manageInventory: { type: Boolean, default: true },
      viewReports: { type: Boolean, default: true },
    },
  },
  { timestamps: true } // Automatically creates createdAt & updatedAt
);

// Prevent OverwriteModelError with Nodemon or hot reload
module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);