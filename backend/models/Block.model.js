const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Block name is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['boys', 'girls', 'mixed'],
      required: [true, 'Block type is required'],
    },
    totalFloors: {
      type: Number,
      required: [true, 'Total floors is required'],
      min: 1,
    },
    warden: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    facilities: [{ type: String }],
    description: { type: String },
    address: { type: String },
    image: { type: String },
    totalRooms: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index
blockSchema.index({ isActive: 1, type: 1 });

module.exports = mongoose.models.Block || mongoose.model('Block', blockSchema);
