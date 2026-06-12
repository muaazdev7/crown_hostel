const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    block: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Block',
      required: [true, 'Block is required'],
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: [0, 'Floor cannot be negative'],
    },
    type: {
      type: String,
      enum: {
        values: ['single', 'double', 'triple', 'dormitory'],
        message: '{VALUE} is not a valid room type',
      },
      required: [true, 'Room type is required'],
      lowercase: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: [0, 'Occupancy cannot be negative'],
    },
    occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    facilities: [{ type: String, trim: true }],
    monthlyRent: { type: Number, min: [0, 'Rent cannot be negative'] },
    status: {
      type: String,
      enum: ['available', 'full'],
      default: 'available',
      lowercase: true,
      trim: true,
    },
    image: { type: String },
  },
  { timestamps: true }
);

// --------------------
// Indexes
// --------------------
roomSchema.index({ roomNumber: 1, block: 1 }, { unique: true }); // unique room per block
roomSchema.index({ status: 1, type: 1 }); // for filtering available/occupied rooms
roomSchema.index({ block: 1, floor: 1 }); // search rooms by block/floor

// --------------------
// Pre-save hook
// --------------------
// Validate occupancy & auto-update status (only "available" or "full")
roomSchema.pre('save', function (next) {
  if (this.currentOccupancy > this.capacity) {
    return next(new Error('Current occupancy cannot exceed room capacity'));
  }

  // Status is purely derived: full when at capacity, available otherwise
  this.status = this.currentOccupancy >= this.capacity ? 'full' : 'available';

  next();
});

// --------------------
// Virtuals
// --------------------
roomSchema.virtual('availableBeds').get(function () {
  return this.capacity - this.currentOccupancy;
});

// Ensure virtuals are included in JSON responses
roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

// --------------------
// Export model
// --------------------
module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);