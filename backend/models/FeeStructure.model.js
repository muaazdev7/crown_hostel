const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Fee structure name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['monthly', 'semester', 'yearly'],
      required: [true, 'Fee type is required'],
    },
    roomType: {
      type: String,
      enum: ['single', 'double', 'triple', 'dormitory'],
    },
    baseFee: {
      type: Number,
      required: [true, 'Base fee is required'],
      min: 0,
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFineRules: {
      finePerDay: { type: Number, default: 0 },
      gracePeriodDays: { type: Number, default: 0 },
      maxFine: { type: Number, default: 0 },
    },
    additionalCharges: { type: mongoose.Schema.Types.Mixed, default: {} },
    components: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    academicYear: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for active fee lookups
feeStructureSchema.index({ isActive: 1, type: 1 });
feeStructureSchema.index({ roomType: 1, academicYear: 1 });

// Virtual: total fee including all components
feeStructureSchema.virtual('totalFee').get(function () {
  const componentsTotal = (this.components || []).reduce(
    (sum, c) => sum + c.amount,
    0
  );
  return this.baseFee + this.securityDeposit + componentsTotal;
});

feeStructureSchema.set('toJSON', { virtuals: true });
feeStructureSchema.set('toObject', { virtuals: true });

module.exports =
  mongoose.models.FeeStructure || mongoose.model('FeeStructure', feeStructureSchema);
