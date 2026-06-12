const mongoose = require('mongoose');

/**
 * MaintenanceRequest — student-submitted maintenance ticket.
 * Auto-routed to staff by designation based on the chosen category.
 *
 * Workflow: pending → assigned → in_progress → completed   (or rejected)
 *   - pending:     submitted but no staff with the required designation exists yet
 *   - assigned:    a matching staff member is responsible
 *   - in_progress: staff has started the work
 *   - completed:   work finished
 *   - rejected:    staff declined the request
 */
const maintenanceRequestSchema = new mongoose.Schema(
  {
    // ── Student (reporter) ──
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for notifications
    studentName: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    roomNumber: { type: String, trim: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, // linked when resolvable

    // ── Issue ──
    category: {
      type: String,
      enum: [
        'electrical', 'plumbing', 'internet', 'furniture',
        'cleaning', 'room_repair', 'ac', 'water_supply', 'general',
      ],
      required: [true, 'Category is required'],
    },
    issueTitle: { type: String, required: [true, 'Issue title is required'], trim: true },
    issueDescription: { type: String, required: [true, 'Issue description is required'], trim: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'medium',
    },
    image: { type: String, default: '' },

    // ── Assignment (student selects designation + specific staff member) ──
    assignedDesignation: { type: String, trim: true },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }, // assignedStaffId
    assignedStaffName: { type: String, trim: true },

    // ── Status ──
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    staffNotes: { type: String, trim: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for the three main query paths
maintenanceRequestSchema.index({ student: 1, createdAt: -1 });   // student "my requests"
maintenanceRequestSchema.index({ assignedStaff: 1, status: 1 }); // staff "requests assigned to me"
maintenanceRequestSchema.index({ status: 1, priority: 1 });      // admin reports

// Prevent OverwriteModelError on Nodemon/hot reload
module.exports =
  mongoose.models.MaintenanceRequest ||
  mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
