const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetRole: {
      type: String,
      enum: ['all', 'student', 'staff'],
      default: 'all',
    },
    isPinned: { type: Boolean, default: false },
    expiresAt: { type: Date },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

// Index
announcementSchema.index({ targetRole: 1, createdAt: -1 });
announcementSchema.index({ isPinned: 1 });

module.exports =
  mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
