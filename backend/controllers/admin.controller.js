const User = require('../models/User.model');
const Student = require('../models/Student.model');
const Staff = require('../models/Staff.model');
const Room = require('../models/Room.model');
const Block = require('../models/Block.model');
const Invoice = require('../models/Invoice.model');
const Complaint = require('../models/Complaint.model');
const Leave = require('../models/Leave.model');
const Announcement = require('../models/Announcement.model');
const Application = require('../models/Application.model');

// GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalStaff,
      totalRooms,
      availableRooms,
      fullRooms,
      pendingFees,
      openComplaints,
      pendingApplications,
    ] = await Promise.all([
      Student.countDocuments(),
      Staff.countDocuments(),
      Room.countDocuments(),
      Room.countDocuments({ status: 'available' }),
      Room.countDocuments({ status: 'full' }),
      Invoice.countDocuments({ status: { $in: ['pending', 'overdue'] } }),
      Complaint.countDocuments({ status: { $in: ['pending', 'in-progress'] } }),
      Application.countDocuments({ status: 'pending' }),
    ]);

    const recentComplaints = await Complaint.find({ status: 'pending' })
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentApplications = await Application.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalStaff,
          totalRooms,
          availableRooms,
          fullRooms,
          pendingFees,
          openComplaints,
          pendingApplications,
        },
        recentComplaints,
        recentApplications,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/announcements
const getAnnouncements = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.targetRole = { $in: [role, 'all'] };

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/announcements
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetRole, expiresAt } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'title and content are required' });
    }
    const announcement = await Announcement.create({
      title, content, targetRole, expiresAt,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/announcements/:id
const updateAnnouncement = async (req, res) => {
  try {
    const { title, content, targetRole, expiresAt } = req.body;
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (targetRole !== undefined) announcement.targetRole = targetRole;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt || null;
    await announcement.save();

    const populated = await announcement.populate('createdBy', 'name');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/announcements/:id
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/announcements/public?role=student|staff
// Returns announcements targeted to the given role OR to "all"
const getPublicAnnouncements = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      filter.targetRole = { $in: [role, 'all'] };
    }
    // Exclude expired announcements
    filter.$or = [
      { expiresAt: null },
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } },
    ];

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/applications — List all applications with filtering, search, pagination
const getApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;

    // Search by student name or registration number
    if (search) {
      filter.$or = [
        { applicantName: { $regex: search, $options: 'i' } },
        { registrationNo: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Application.countDocuments(filter);
    const applications = await Application.find(filter)
      .populate('preferredBlock', 'name type')
      .populate('assignedRoom', 'roomNumber type capacity')
      .populate('reviewedBy', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/applications/:id — Generic update (kept for backward compat)
const updateApplication = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Business rule: cannot approve/reject already processed applications
    if (status && application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update status — application is already ${application.status}`,
      });
    }

    application.status = status || application.status;
    application.remarks = remarks || application.remarks;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/applications/:id/approve — Approve an application
const approveApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Business rule: cannot approve already processed applications
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve — application is already ${application.status}`,
      });
    }

    application.status = 'approved';
    application.remarks = req.body.remarks || application.remarks;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    res.json({ success: true, message: 'Application approved', data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/applications/:id/reject — Reject an application
const rejectApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Business rule: cannot reject already processed applications
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject — application is already ${application.status}`,
      });
    }

    application.status = 'rejected';
    application.remarks = req.body.remarks || 'Application rejected by admin';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    res.json({ success: true, message: 'Application rejected', data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/applications/:id/assign-room — Assign a room to an approved application
// Syncs Application, Student, and Room in one transaction-like flow
const assignRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ success: false, message: 'Room ID is required' });
    }

    // 1. Fetch application
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Business rule: only approved applications can be assigned a room
    if (application.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign room — application status is "${application.status}". Only approved applications can be assigned a room.`,
      });
    }

    // Prevent double assignment
    if (application.assignedRoom) {
      return res.status(400).json({
        success: false,
        message: 'This application already has a room assigned',
      });
    }

    // 2. Fetch room and validate capacity
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.currentOccupancy >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is full — no beds available' });
    }

    // 3. Find the student by registrationNo (matches Student.rollNumber)
    //    or by the application.student field if already linked
    let student = null;
    if (application.student) {
      student = await Student.findById(application.student);
    }
    if (!student) {
      student = await Student.findOne({ rollNumber: application.registrationNo });
    }
    if (!student) {
      // Try matching by email through User model
      const user = await User.findOne({ email: application.applicantEmail });
      if (user) {
        student = await Student.findOne({ user: user._id });
      }
    }
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'No matching student record found for this application. Please create the student profile first.',
      });
    }

    // If student already has a room, remove them from the old room first
    if (student.room) {
      const oldRoom = await Room.findById(student.room);
      if (oldRoom) {
        oldRoom.occupants = oldRoom.occupants.filter(
          id => id.toString() !== student._id.toString()
        );
        oldRoom.currentOccupancy = Math.max(0, oldRoom.currentOccupancy - 1);
        await oldRoom.save(); // pre-save hook auto-updates status
      }
    }

    // 4. Update all three documents
    // Application
    application.assignedRoom = room._id;
    application.student = student._id;
    application.remarks = req.body.remarks || `Room ${room.roomNumber} assigned`;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();

    // Student
    student.room = room._id;
    student.block = room.block;

    // Room — add student to occupants and increment count
    room.occupants.addToSet(student._id);
    room.currentOccupancy = room.currentOccupancy + 1;
    // status is auto-calculated by pre-save hook

    // 5. Save all three
    await Promise.all([
      application.save(),
      student.save(),
      room.save(),
    ]);

    // Return populated application for frontend
    const populated = await Application.findById(application._id)
      .populate('assignedRoom', 'roomNumber type capacity currentOccupancy status')
      .populate('student', 'rollNumber')
      .populate('reviewedBy', 'name');

    res.json({ success: true, message: `Room ${room.roomNumber} assigned successfully`, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/applications/history — View all processed (non-pending) applications
const getApplicationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = { status: { $ne: 'pending' } };

    // Optional: further filter by specific processed status
    if (status && status !== 'pending') {
      filter.status = status;
    }

    // Search by name or registration number
    if (search) {
      filter.$or = [
        { applicantName: { $regex: search, $options: 'i' } },
        { registrationNo: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Application.countDocuments(filter);
    const applications = await Application.find(filter)
      .populate('preferredBlock', 'name type')
      .populate('assignedRoom', 'roomNumber type capacity')
      .populate('reviewedBy', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ reviewedAt: -1 });

    res.json({
      success: true,
      data: applications,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, data: { _id: user._id, status: user.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/applications/:id — Permanently delete an application
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ success: true, message: 'Application deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDashboardStats, getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, getPublicAnnouncements,
  getApplications, updateApplication, approveApplication, rejectApplication,
  assignRoom, deleteApplication, getApplicationHistory, getUsers, toggleUserStatus,
};
