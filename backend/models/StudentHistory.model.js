const mongoose = require('mongoose');

const studentHistorySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    previousRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: false,
    },
    newRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: false,
    },
    action: {
      type: String,
      enum: {
        values: ['allocated', 'transferred', 'checked_out'],
        message: '{VALUE} is not a valid action',
      },
      required: [true, 'Action is required'],
      trim: true,
      lowercase: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    remarks: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

// Indexes for faster queries
studentHistorySchema.index({ student: 1, date: -1 });
studentHistorySchema.index({ action: 1 });

// Prevent OverwriteModelError on hot reload / nodemon
module.exports =
  mongoose.models.StudentHistory ||
  mongoose.model('StudentHistory', studentHistorySchema);