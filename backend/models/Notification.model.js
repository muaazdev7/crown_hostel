const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['fee', 'complaint', 'leave', 'announcement', 'application', 'inventory', 'salary', 'general'],
      default: 'general',
      lowercase: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      trim: true,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true } // creates createdAt & updatedAt automatically
);

// Indexes for fast queries
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// Prevent OverwriteModelError on hot reload / nodemon
module.exports =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);