const mongoose = require('mongoose');

/**
 * Bill — a hostel/organization operational utility bill.
 * NOT related to students, student fees, or student payments.
 * Managed exclusively by Wardens (create/view/update) and Admins (+ delete/reports).
 */
const billSchema = new mongoose.Schema(
  {
    billNumber: { type: String, required: true, unique: true, trim: true },
    billType: {
      type: String,
      enum: [
        'electricity', 'internet', 'water', 'gas', 'generator_fuel',
        'maintenance_services', 'security_services', 'waste_management', 'other',
      ],
      required: [true, 'Bill type is required'],
    },
    serviceProvider: { type: String, required: [true, 'Service provider is required'], trim: true },
    referenceNumber: { type: String, trim: true },

    // Financials
    amount: { type: Number, required: [true, 'Amount is required'], min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    // Dates
    billingDate: { type: Date, required: [true, 'Billing date is required'] },
    dueDate: { type: Date },
    paymentDate: { type: Date },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled'],
      default: 'pending',
    },

    description: { type: String, trim: true },
    remarks: { type: String, trim: true },
    attachment: { type: String, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes for filtering / reporting
billSchema.index({ billType: 1, paymentStatus: 1 });
billSchema.index({ billingDate: -1 });
billSchema.index({ serviceProvider: 1 });

module.exports = mongoose.models.Bill || mongoose.model('Bill', billSchema);
