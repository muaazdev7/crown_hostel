const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      unique: true,
      required: [true, 'Receipt number is required'],
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Invoice reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    amountPaid: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    paymentDate: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: {
        values: ['cash', 'online', 'cheque', 'dd', 'upi'],
        message: '{VALUE} is not a valid payment method',
      },
      required: [true, 'Payment method is required'],
    },
    transactionId: { type: String },
    remarks: { type: String },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes — supports multiple payments per invoice
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ student: 1, paymentDate: -1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
