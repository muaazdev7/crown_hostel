const mongoose = require('mongoose');

/**
 * VisitorRequest — student-submitted request for a visitor.
 * Automatically routed to Warden staff for approval.
 *
 * Workflow: pending → approved | rejected
 *
 * Distinct from the Visitor model (which is the warden's walk-in check-in log).
 */
const visitorRequestSchema = new mongoose.Schema(
  {
    // ── Student (requester) ──
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for notifications
    studentName: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    roomNumber: { type: String, trim: true },

    // ── Visitor details ──
    visitorName: { type: String, required: [true, 'Visitor name is required'], trim: true },
    visitorCNIC: { type: String, trim: true },
    visitorPhone: { type: String, required: [true, 'Visitor phone is required'], trim: true },
    relationship: { type: String, trim: true },
    visitDate: { type: Date, required: [true, 'Visit date is required'] },
    visitTime: { type: String, trim: true },
    purpose: { type: String, trim: true },

    // ── Status / warden action ──
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    wardenResponse: { type: String, trim: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

visitorRequestSchema.index({ student: 1, createdAt: -1 });
visitorRequestSchema.index({ status: 1, createdAt: -1 });

module.exports =
  mongoose.models.VisitorRequest || mongoose.model('VisitorRequest', visitorRequestSchema);
