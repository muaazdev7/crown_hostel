const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      enum: ['room', 'plumbing', 'electrical', 'cleanliness', 'food', 'security', 'other'],
      required: [true, 'Category is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'closed'],
      default: 'pending',
    },
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    remarks: { type: String },
    resolvedAt: { type: Date },
    images: [{ type: String }],
  },
  { timestamps: true }
);

// Indexes for dashboard and filtering
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ student: 1 });
complaintSchema.index({ assignedStaff: 1, status: 1 });

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
