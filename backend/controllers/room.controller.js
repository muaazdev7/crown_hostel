const fs = require('fs');
const path = require('path');
const Room = require('../models/Room.model');
const Block = require('../models/Block.model');
const RoomAllocation = require('../models/RoomAllocation.model');
const Student = require('../models/Student.model');
const Application = require('../models/Application.model');
const { uploadOnCloudinary } = require('../utils/cloudinary');

// Helper: delete an uploaded image file from disk
const deleteImage = (imagePath) => {
  if (!imagePath) return;
  const fullPath = path.join(__dirname, '..', imagePath);
  fs.unlink(fullPath, () => {}); // ignore errors (file may already be gone)
};

// ─────────────────────────────────────────────
// ROOMS
// ─────────────────────────────────────────────

// GET /api/rooms
const getRooms = async (req, res) => {
  try {
    const { page = 1, limit = 20, block, status, type } = req.query;
    const filter = {};
    if (block) filter.block = block;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const total = await Room.countDocuments(filter);
    const rooms = await Room.find(filter)
      .populate('block', 'name type')
      .populate('occupants', 'rollNumber')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ roomNumber: 1 });

    res.json({ success: true, data: rooms, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/rooms/:id
const getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('block')
      .populate({ path: 'occupants', populate: { path: 'user', select: 'name email' } });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/rooms  (multipart/form-data with optional image)
const createRoom = async (req, res) => {
  try {
    const { roomNumber, block, floor, type, capacity, facilities, monthlyRent } = req.body;
    if (!roomNumber || !block || floor == null || !type || !capacity) {
      return res.status(400).json({ success: false, message: 'roomNumber, block, floor, type and capacity are required' });
    }
    const exists = await Room.findOne({ roomNumber, block });
    if (exists) return res.status(400).json({ success: false, message: 'Room number already exists in this block' });

    // Parse facilities if sent as JSON string (FormData)
    let parsedFacilities = facilities;
    if (typeof facilities === 'string') {
      try { parsedFacilities = JSON.parse(facilities); } catch { parsedFacilities = []; }
    }

    const roomData = {
      roomNumber, block, floor: Number(floor), type,
      capacity: Number(capacity), monthlyRent: Number(monthlyRent) || undefined,
      facilities: parsedFacilities || [],
    };

    if (req.file) {
      const result = await uploadOnCloudinary(req.file.path, 'hostel-management/rooms');
      if (!result?.secure_url) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      roomData.image = result.secure_url;
    }

    const room = await Room.create(roomData);
    await Block.findByIdAndUpdate(block, { $inc: { totalRooms: 1 } });

    const populated = await Room.findById(room._id).populate('block', 'name type');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/rooms/:id  (multipart/form-data with optional image)
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const { type, capacity, monthlyRent, facilities } = req.body;

    const updates = {};
    if (type) updates.type = type;
    if (capacity) updates.capacity = Number(capacity);
    if (monthlyRent !== undefined) updates.monthlyRent = Number(monthlyRent) || 0;
    // Status is auto-calculated — not manually settable

    if (facilities) {
      if (typeof facilities === 'string') {
        try { updates.facilities = JSON.parse(facilities); } catch { /* keep existing */ }
      } else {
        updates.facilities = facilities;
      }
    }

    if (req.file) {
      const result = await uploadOnCloudinary(req.file.path, 'hostel-management/rooms');
      if (!result?.secure_url) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      updates.image = result.secure_url;
    }

    const updated = await Room.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('block', 'name type');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/rooms/:id
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.currentOccupancy > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete room with occupants' });
    }

    deleteImage(room.image);
    await Room.findByIdAndDelete(req.params.id);
    await Block.findByIdAndUpdate(room.block, { $inc: { totalRooms: -1 } });

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// ROOM ALLOCATION
// ─────────────────────────────────────────────

// POST /api/rooms/allocate
const allocateRoom = async (req, res) => {
  try {
    const { studentId, roomId, remarks } = req.body;
    if (!studentId || !roomId) {
      return res.status(400).json({ success: false, message: 'studentId and roomId are required' });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.currentOccupancy >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is full' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // If student already has a room, remove them from the old room
    if (student.room) {
      const oldRoom = await Room.findById(student.room);
      if (oldRoom) {
        oldRoom.occupants = oldRoom.occupants.filter(
          id => id.toString() !== student._id.toString()
        );
        oldRoom.currentOccupancy = Math.max(0, oldRoom.currentOccupancy - 1);
        await oldRoom.save(); // pre-save hook auto-updates status
      }
      // Clear old application assignment
      await Application.updateMany(
        { student: student._id, assignedRoom: student.room },
        { $set: { assignedRoom: null } }
      );
    }

    // Vacate existing active allocation
    await RoomAllocation.updateMany(
      { student: studentId, status: 'active' },
      { status: 'transferred', vacatingDate: new Date() }
    );

    const allocation = await RoomAllocation.create({
      student: studentId,
      room: roomId,
      block: room.block,
      allocatedBy: req.user._id,
      remarks,
    });

    // Update room — use save() so the pre-save hook auto-calculates status
    room.occupants.addToSet(student._id);
    room.currentOccupancy = room.currentOccupancy + 1;
    await room.save();

    // Update student record
    student.room = roomId;
    student.block = room.block;
    await student.save();

    // Also update any approved application for this student
    await Application.updateMany(
      {
        $or: [
          { student: student._id, status: 'approved', assignedRoom: null },
          { registrationNo: student.rollNumber, status: 'approved', assignedRoom: null },
        ],
      },
      { $set: { assignedRoom: roomId, student: student._id } }
    );

    res.status(201).json({ success: true, data: allocation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// BLOCKS
// ─────────────────────────────────────────────

// GET /api/rooms/blocks
const getBlocks = async (req, res) => {
  try {
    const blocks = await Block.find({ isActive: true }).populate('warden', 'employeeId designation');
    res.json({ success: true, data: blocks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/rooms/blocks/:id
const getBlock = async (req, res) => {
  try {
    const block = await Block.findById(req.params.id).populate('warden', 'employeeId designation');
    if (!block) return res.status(404).json({ success: false, message: 'Block not found' });
    res.json({ success: true, data: block });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/rooms/blocks  (multipart/form-data with optional image)
const createBlock = async (req, res) => {
  try {
    const { name, type, totalFloors, facilities, address, description } = req.body;
    if (!name || !type || !totalFloors) {
      return res.status(400).json({ success: false, message: 'name, type and totalFloors are required' });
    }

    let parsedFacilities = facilities;
    if (typeof facilities === 'string') {
      try { parsedFacilities = JSON.parse(facilities); } catch { parsedFacilities = []; }
    }

    const blockData = {
      name, type, totalFloors: Number(totalFloors),
      facilities: parsedFacilities || [], address, description,
    };

    if (req.file) {
      blockData.image = `/uploads/blocks/${req.file.filename}`;
    }

    const block = await Block.create(blockData);
    res.status(201).json({ success: true, data: block });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/rooms/blocks/:id  (multipart/form-data with optional image)
const updateBlock = async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ success: false, message: 'Block not found' });

    const { name, type, totalFloors, facilities, address, description, isActive } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (type) updates.type = type;
    if (totalFloors) updates.totalFloors = Number(totalFloors);
    if (address !== undefined) updates.address = address;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;

    if (facilities) {
      if (typeof facilities === 'string') {
        try { updates.facilities = JSON.parse(facilities); } catch { /* keep existing */ }
      } else {
        updates.facilities = facilities;
      }
    }

    if (req.file) {
      deleteImage(block.image); // remove old image
      updates.image = `/uploads/blocks/${req.file.filename}`;
    }

    const updated = await Block.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/rooms/blocks/:id
const deleteBlock = async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ success: false, message: 'Block not found' });

    // Check if block has rooms
    const roomCount = await Room.countDocuments({ block: req.params.id });
    if (roomCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete block that has rooms. Remove all rooms first.' });
    }

    deleteImage(block.image);
    await Block.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Block deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getRooms, getRoom, createRoom, updateRoom, deleteRoom,
  allocateRoom,
  getBlocks, getBlock, createBlock, updateBlock, deleteBlock,
};
