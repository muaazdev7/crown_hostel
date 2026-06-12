const Student = require('../models/Student.model');
const User = require('../models/User.model');
const Room = require('../models/Room.model');
const RoomAllocation = require('../models/RoomAllocation.model');
const Application = require('../models/Application.model');
const Invoice = require('../models/Invoice.model');
const Complaint = require('../models/Complaint.model');
const Attendance = require('../models/Attendance.model');
const Leave = require('../models/Leave.model');
const Notification = require('../models/Notification.model');
const InventoryAssignment = require('../models/InventoryAssignment.model');

// GET /api/students
const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, department, year, search } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (year) filter.year = Number(year);

    let query = Student.find(filter)
      .populate('user', 'name email phone status')
      .populate('room', 'roomNumber')
      .populate('block', 'name');

    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: 'i' },
        role: 'student',
      }).select('_id');
      query = Student.find({ ...filter, user: { $in: users.map(u => u._id) } })
        .populate('user', 'name email phone status')
        .populate('room', 'roomNumber')
        .populate('block', 'name');
    }

    const total = await Student.countDocuments(filter);
    const students = await query
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, data: students, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/students/:id
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', '-password')
      .populate('room')
      .populate('block');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper: parse fields that arrive as JSON strings from FormData
const parseJsonField = (value) => {
  if (!value) return undefined;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return value; }
};

// POST /api/students  (accepts JSON or multipart/form-data with image)
const createStudent = async (req, res) => {
  try {
    const { name, email, password, phone, rollNumber, department, year, semester,
      gender, bloodGroup } = req.body;

    // Parse nested objects that come as strings when sent via FormData
    const guardianDetails = parseJsonField(req.body.guardianDetails);
    const contactInfo = parseJsonField(req.body.contactInfo);

    if (!name || !email || !password || !rollNumber || !department || !year) {
      return res.status(400).json({ success: false, message: 'name, email, password, rollNumber, department and year are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already in use' });

    const existingRoll = await Student.findOne({ rollNumber });
    if (existingRoll) return res.status(400).json({ success: false, message: 'Roll number already exists' });

    const user = await User.create({ name, email, password, role: 'student', phone });

    const student = await Student.create({
      user: user._id, rollNumber, department, year, semester, gender, bloodGroup,
      guardianDetails, contactInfo,
      ...(req.file ? { profileImage: `/uploads/${req.file.filename}` } : {}),
    });

    await User.findByIdAndUpdate(user._id, { profileRef: student._id, profileModel: 'Student' });

    const populated = await Student.findById(student._id)
      .populate('user', 'name email phone status');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/students/:id — Update both Student fields and linked User fields
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Separate User-level fields from Student-level fields
    const { name, email, phone, password, guardianDetails, contactInfo, ...studentFields } = req.body;

    // Parse nested objects that come as strings when sent via FormData
    if (guardianDetails) studentFields.guardianDetails = parseJsonField(guardianDetails);
    if (contactInfo) studentFields.contactInfo = parseJsonField(contactInfo);

    // Handle profile image upload
    if (req.file) {
      studentFields.profileImage = `/uploads/${req.file.filename}`;
    }

    // If rollNumber is being changed, check uniqueness
    if (studentFields.rollNumber && studentFields.rollNumber !== student.rollNumber) {
      const existingRoll = await Student.findOne({ rollNumber: studentFields.rollNumber });
      if (existingRoll) {
        return res.status(400).json({ success: false, message: 'Roll number already exists' });
      }
    }

    // Update User model fields (name, email, phone) if provided
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (email) userUpdates.email = email;
    if (phone !== undefined) userUpdates.phone = phone;

    if (Object.keys(userUpdates).length > 0) {
      // If email is being changed, check uniqueness
      if (email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: student.user } });
        if (existingEmail) {
          return res.status(400).json({ success: false, message: 'Email already in use by another account' });
        }
      }
      await User.findByIdAndUpdate(student.user, userUpdates, { runValidators: true });
    }

    // Update password separately (triggers pre-save hash)
    if (password) {
      const user = await User.findById(student.user).select('+password');
      user.password = password;
      await user.save();
    }

    // Update Student model fields
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id, studentFields, { new: true, runValidators: true }
    ).populate('user', 'name email phone status')
     .populate('room', 'roomNumber')
     .populate('block', 'name');

    res.json({ success: true, data: updatedStudent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/students/:id — Permanently delete student and associated user
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // If student has an assigned room, free it first
    if (student.room) {
      const room = await Room.findById(student.room);
      if (room) {
        room.occupants = room.occupants.filter(
          id => id.toString() !== student._id.toString()
        );
        room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
        await room.save();
      }
      // Clear application assignment
      await Application.updateMany(
        { student: student._id, assignedRoom: student.room },
        { $set: { assignedRoom: null } }
      );
    }

    // Vacate active RoomAllocation records
    await RoomAllocation.updateMany(
      { student: student._id, status: 'active' },
      { status: 'vacated', vacatedAt: new Date() }
    );

    // Delete the User account
    await User.findByIdAndDelete(student.user);

    // Delete the Student profile
    await Student.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Student permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/students/:id/unassign-room
// Syncs Student, Room, Application, and RoomAllocation
const unassignRoom = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (!student.room) {
      return res.status(400).json({ success: false, message: 'Student has no assigned room' });
    }

    const roomId = student.room;

    // 1. Update room: remove student from occupants, decrease occupancy
    const room = await Room.findById(roomId);
    if (room) {
      room.occupants = room.occupants.filter(
        id => id.toString() !== student._id.toString()
      );
      room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
      // status is auto-calculated by pre-save hook
      await room.save();
    }

    // 2. Vacate active RoomAllocation records for this student
    await RoomAllocation.updateMany(
      { student: student._id, status: 'active' },
      { status: 'vacated', vacatedAt: new Date() }
    );

    // 3. Clear assignedRoom on any Application linked to this student + room
    await Application.updateMany(
      {
        $or: [
          { student: student._id, assignedRoom: roomId },
          { registrationNo: student.rollNumber, assignedRoom: roomId },
        ],
      },
      { $set: { assignedRoom: null } }
    );

    // 4. Clear room and block from student
    student.room = undefined;
    student.block = undefined;
    await student.save();

    const updated = await Student.findById(req.params.id)
      .populate('user', 'name email phone status')
      .populate('room', 'roomNumber')
      .populate('block', 'name');

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/students/profile — Fetch logged-in student's own profile
const getProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware (the User document)
    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'name email phone')
      .populate('room', 'roomNumber')
      .populate('block', 'name');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/students/profile — Update logged-in student's own profile
const updateProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const {
      // Personal fields
      fullName, gender, dateOfBirth, cnic, nationality,
      // Academic fields
      registrationNumber, department, program, semester, session, batch, cgpa, academicStatus,
      // Contact fields
      email, phone, emergencyContact, guardianContact,
      // Address fields
      street, city, state, pincode,
      // Guardian detail fields
      guardianName, guardianEmail, guardianRelation,
    } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (phone && !/^\d{10,15}$/.test(phone.replace(/[-()\s]/g, ''))) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (cgpa !== undefined && cgpa !== '' && (Number(cgpa) < 0 || Number(cgpa) > 4)) {
      return res.status(400).json({ success: false, message: 'CGPA must be between 0 and 4' });
    }
    if (semester !== undefined && semester !== '' && (Number(semester) < 1 || Number(semester) > 12)) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 12' });
    }

    // If registrationNumber is being changed, check uniqueness
    if (registrationNumber && registrationNumber !== student.rollNumber) {
      const existingRoll = await Student.findOne({ rollNumber: registrationNumber });
      if (existingRoll) {
        return res.status(400).json({ success: false, message: 'Registration number already exists' });
      }
    }

    // ── Update User model fields (name, email, phone) ───────────────────────
    const userUpdates = {};
    if (fullName) userUpdates.name = fullName;
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already in use by another account' });
      }
      userUpdates.email = email;
    }
    if (phone !== undefined) userUpdates.phone = phone;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdates, { runValidators: true });
    }

    // ── Build Student document update ───────────────────────────────────────
    const studentUpdate = {};

    // Personal fields
    if (gender !== undefined) studentUpdate.gender = gender;
    if (dateOfBirth !== undefined) studentUpdate.dateOfBirth = dateOfBirth || null;
    if (cnic !== undefined) studentUpdate.cnic = cnic;
    if (nationality !== undefined) studentUpdate.nationality = nationality;

    // Academic fields
    if (registrationNumber !== undefined) studentUpdate.rollNumber = registrationNumber;
    if (department !== undefined) studentUpdate.department = department;
    if (program !== undefined) studentUpdate.program = program;
    if (semester !== undefined && semester !== '') studentUpdate.semester = Number(semester);
    if (session !== undefined) studentUpdate.session = session;
    if (batch !== undefined) studentUpdate.batch = batch;
    if (cgpa !== undefined && cgpa !== '') studentUpdate.cgpa = Number(cgpa);
    if (academicStatus !== undefined) studentUpdate.academicStatus = academicStatus;

    // Contact info
    studentUpdate.contactInfo = {
      phone: phone !== undefined ? phone : student.contactInfo?.phone,
      alternatePhone: emergencyContact !== undefined ? emergencyContact : student.contactInfo?.alternatePhone,
      address: {
        street: street !== undefined ? street : student.contactInfo?.address?.street,
        city: city !== undefined ? city : student.contactInfo?.address?.city,
        state: state !== undefined ? state : student.contactInfo?.address?.state,
        pincode: pincode !== undefined ? pincode : student.contactInfo?.address?.pincode,
      },
    };

    // Guardian details
    studentUpdate.guardianDetails = {
      name: guardianName !== undefined ? guardianName : student.guardianDetails?.name,
      phone: guardianContact !== undefined ? guardianContact : student.guardianDetails?.phone,
      email: guardianEmail !== undefined ? guardianEmail : student.guardianDetails?.email,
      relation: guardianRelation !== undefined ? guardianRelation : student.guardianDetails?.relation,
    };

    // Update the student document
    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      studentUpdate,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email phone')
      .populate('room', 'roomNumber')
      .populate('block', 'name');

    res.json({ success: true, data: updatedStudent, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/students/profile/photo — Upload profile photo for logged-in student
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Delete old profile image file if it exists
    if (student.profileImage) {
      const fs = require('fs');
      const oldPath = require('path').join(__dirname, '..', student.profileImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new image path
    const imagePath = `/uploads/profiles/${req.file.filename}`;
    student.profileImage = imagePath;
    await student.save();

    res.json({
      success: true,
      data: { profileImage: imagePath },
      message: 'Profile photo uploaded successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/students/dashboard — Aggregated dashboard data for logged-in student
const getDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('room', 'roomNumber floor')
      .populate('block', 'name');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Run all queries in parallel for performance
    const [invoices, complaints, attendanceRecords, leaves, notifications] = await Promise.all([
      // Fee invoices for this student
      Invoice.find({ student: student._id }).select('totalAmount discount fine paidAmount status dueDate').lean(),
      // Complaints filed by this student
      Complaint.find({ student: student._id }).select('title status category createdAt').sort({ createdAt: -1 }).lean(),
      // Attendance records (last 30 days)
      Attendance.find({
        student: student._id,
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }).select('date status').sort({ date: -1 }).lean(),
      // Leave requests
      Leave.find({ student: student._id }).select('status').lean(),
      // Notifications for this user
      Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    // Calculate fee stats
    const outstandingFee = invoices.reduce((sum, inv) => sum + (inv.totalAmount + (inv.fine || 0) - (inv.discount || 0) - inv.paidAmount), 0);
    const pendingInvoices = invoices.filter(inv => inv.status !== 'paid').length;

    // Attendance stats
    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const attendancePercent = attendanceRecords.length > 0
      ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;

    // Complaint stats
    const openComplaints = complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length;

    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          profileImage: student.profileImage,
          room: student.room,
          block: student.block,
        },
        stats: {
          room: student.room ? {
            roomNumber: student.room.roomNumber,
            floor: student.room.floor,
            blockName: student.block?.name,
          } : null,
          fee: { outstandingFee, pendingInvoices },
          complaints: { open: openComplaints, total: complaints.length },
          attendance: { percent: attendancePercent, daysTracked: attendanceRecords.length },
        },
        recentComplaints: complaints.slice(0, 3),
        notifications,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/students/my-room — Room details, allocation, and inventory for logged-in student
const getMyRoom = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    if (!student.room) {
      return res.json({ success: true, data: { room: null, allocation: null, inventory: [] } });
    }

    // Run all queries in parallel
    const [room, allocation, inventory] = await Promise.all([
      // Full room details with block and occupants
      Room.findById(student.room)
        .populate('block')
        .populate({
          path: 'occupants',
          select: 'rollNumber profileImage user',
          populate: { path: 'user', select: 'name' },
        }),
      // Active allocation for this student
      RoomAllocation.findOne({ student: student._id, status: 'active' })
        .select('bedNumber startDate endDate status'),
      // Inventory assigned to this room
      InventoryAssignment.find({ room: student.room, status: 'active' })
        .populate('inventory', 'itemName category image')
        .select('quantity condition status'),
    ]);

    res.json({
      success: true,
      data: { room, allocation, inventory },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, unassignRoom, getProfile, updateProfile, uploadProfilePhoto, getDashboard, getMyRoom };
