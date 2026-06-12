const mongoose = require('mongoose');

const roomAllocationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required'],
    },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'vacated', 'transferred'],
      default: 'active',
    },
    vacatedAt: { type: Date },
    vacateReason: { type: String },
    bedNumber: { type: String },
  },
  { timestamps: true }
);

// Indexes
roomAllocationSchema.index({ student: 1, status: 1 });
roomAllocationSchema.index({ room: 1, status: 1 });

module.exports =
  mongoose.models.RoomAllocation || mongoose.model('RoomAllocation', roomAllocationSchema);
