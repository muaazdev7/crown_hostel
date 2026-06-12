const mongoose = require('mongoose');

const inventoryAssignmentSchema = new mongoose.Schema(
  {
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Inventory item reference is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // optional
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    returnedDate: {
      type: Date,
    },
    condition: {
      type: String,
      enum: ['good', 'damaged', 'repair'],
      default: 'good',
    },
    status: {
      type: String,
      enum: ['active', 'returned', 'damaged'],
      default: 'active',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true } // auto createdAt & updatedAt
);

// Indexes for faster queries
inventoryAssignmentSchema.index({ room: 1, status: 1 });
inventoryAssignmentSchema.index({ inventory: 1 });

// Prevent OverwriteModelError on nodemon/hot reload
module.exports =
  mongoose.models.InventoryAssignment ||
  mongoose.model('InventoryAssignment', inventoryAssignmentSchema);