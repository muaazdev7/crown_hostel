const mongoose = require('mongoose');

/**
 * InventoryReport — staff-submitted reports about inventory items.
 * Two kinds, distinguished by `reportType`:
 *   - SHORTAGE: an item is running low / quantity mismatch. Uses currentQuantity + reportedQuantity.
 *   - DAMAGE:   an item is damaged. Uses severity + optional image.
 *
 * Status lifecycle:
 *   SHORTAGE: pending → in_review → resolved (or rejected)
 *   DAMAGE:   pending → in_review → repair_scheduled → repaired | replaced (or rejected)
 */
const inventoryReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ['SHORTAGE', 'DAMAGE'],
      required: [true, 'Report type is required'],
      uppercase: true,
    },

    // Reference to the inventory item + a name snapshot (so reports survive item deletion)
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Inventory item is required'],
    },
    itemName: { type: String, trim: true },

    // ── Shortage-specific ──
    currentQuantity: { type: Number, min: 0 },
    reportedQuantity: { type: Number, min: 0 },

    // ── Damage-specific ──
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe'],
    },
    image: { type: String, default: '' },

    // Shared
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },

    // Reporter (staff)
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    reportedByName: { type: String, trim: true },

    // Status
    status: {
      type: String,
      enum: ['pending', 'in_review', 'resolved', 'repair_scheduled', 'repaired', 'replaced', 'rejected'],
      default: 'pending',
    },

    // Admin response
    adminResponse: { type: String, trim: true },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    responseDate: { type: Date },
  },
  { timestamps: true }
);

// Indexes for fast filtering on the admin reports dashboard and staff "my reports"
inventoryReportSchema.index({ reportType: 1, status: 1 });
inventoryReportSchema.index({ reportedBy: 1, createdAt: -1 });
inventoryReportSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.InventoryReport || mongoose.model('InventoryReport', inventoryReportSchema);
