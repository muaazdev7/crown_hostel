const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: [true, 'Invoice number is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    feeStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure',
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    discount: { type: Number, default: 0, min: 0 },
    fine: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    description: { type: String },
    academicYear: { type: String },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending',
    },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes
invoiceSchema.index({ student: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });
// Note: invoiceNumber index is already created by `unique: true` on the field

// Virtual: outstanding balance
invoiceSchema.virtual('outstandingBalance').get(function () {
  return this.totalAmount + this.fine - this.discount - this.paidAmount;
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
