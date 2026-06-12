const mongoose = require('mongoose');

/**
 * Salary — one record per staff member per payment month/year.
 * Created/updated when an admin confirms a salary payment.
 */
const salarySchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true }, // staffId
    staffName: { type: String, trim: true },
    employeeId: { type: String, trim: true },
    designation: { type: String, trim: true },
    salaryAmount: { type: Number, required: true, min: 0 },
    paymentMonth: { type: Number, required: true, min: 1, max: 12 },
    paymentYear: { type: Number, required: true },
    paymentDate: { type: Date },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

// One salary record per staff per month/year
salarySchema.index({ staff: 1, paymentMonth: 1, paymentYear: 1 }, { unique: true });
salarySchema.index({ paymentYear: 1, paymentMonth: 1 });

module.exports = mongoose.models.Salary || mongoose.model('Salary', salarySchema);
