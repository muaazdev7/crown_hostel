const mongoose = require('mongoose');

/**
 * ExpenseReportDeletion — records which dynamically-generated inventory expense
 * reports (a given month or year) the admin has deleted. The monthly/yearly
 * report aggregations exclude any period listed here, so deletions persist in
 * MongoDB and never reappear after refresh — without destroying inventory data.
 */
const expenseReportDeletionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['monthly', 'yearly'], required: true },
    year: { type: Number, required: true },
    month: { type: Number, min: 1, max: 12 }, // set only for monthly reports
  },
  { timestamps: true }
);

expenseReportDeletionSchema.index({ type: 1, year: 1, month: 1 }, { unique: true });

module.exports =
  mongoose.models.ExpenseReportDeletion ||
  mongoose.model('ExpenseReportDeletion', expenseReportDeletionSchema);
