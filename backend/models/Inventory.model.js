const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: [
          'furniture',
          'electronics',
          'bedding',
          'cleaning',
          'kitchen',
          'sports',
          'stationery',
          'other',
        ],
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Category is required'],
    },
    description: { type: String },
    image: { type: String, default: '' },
    totalQuantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    availableQuantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: 'pcs' },
    assignedRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'poor', 'damaged'],
      default: 'good',
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'repair', 'disposed'],
      default: 'available',
    },
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number, min: 0 },
    supplier: { type: String },
    lowStockThreshold: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
    damageDescription: { type: String },
    damageReportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    damageReportedAt: { type: Date },
    repairStatus: {
      type: String,
      enum: ['none', 'pending', 'in_progress', 'repaired', 'replaced'],
      default: 'none',
    },
    // Expense ledger — one entry per cost-generating action, used by the
    // weekly/monthly inventory expense reports (aggregated live by date).
    expenseEntries: [
      {
        category: { type: String, enum: ['purchase', 'shortage', 'repair'], required: true },
        amount: { type: Number, required: true, min: 0 },
        quantityAdded: { type: Number, min: 0 },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
inventorySchema.index({ category: 1 });
inventorySchema.index({ status: 1, condition: 1 });
inventorySchema.index({ assignedRoom: 1 });
inventorySchema.index({ block: 1 });

// Virtual: low stock alert
inventorySchema.virtual('isLowStock').get(function () {
  return this.availableQuantity <= this.lowStockThreshold;
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
