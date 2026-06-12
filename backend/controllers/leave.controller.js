const Leave = require('../models/Leave.model');
const Student = require('../models/Student.model');
const Staff = require('../models/Staff.model');

// GET /api/leaves
const getLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, leaveType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;

    // Students see only their own leaves
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) filter.student = student._id;
    }

    const total = await Leave.countDocuments(filter);
    const leaves = await Leave.find(filter)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('approvedBy', 'name role')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/leaves
const applyLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason, destination, contactDuring } = req.body;
    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({ success: false, message: 'leaveType, fromDate, toDate and reason are required' });
    }

    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ success: false, message: 'fromDate must be before toDate' });
    }

    const leave = await Leave.create({
      student: student._id, leaveType, fromDate, toDate, reason, destination, contactDuring,
    });

    // Return populated leave for consistent frontend display
    const populated = await Leave.findById(leave._id)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/leaves/:id
const updateLeave = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const updates = { ...req.body };

    // Staff members must be Warden to approve/reject leaves
    if ((status === 'approved' || status === 'rejected') && req.user.role === 'staff') {
      const staffProfile = await Staff.findOne({ user: req.user._id });
      if (!staffProfile || staffProfile.designation !== 'Warden') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Warden privileges required.',
        });
      }
    }

    if ((status === 'approved' || status === 'rejected') && req.user.role !== 'student') {
      updates.approvedBy = req.user._id;
      updates.approvedAt = new Date();
    }

    const leave = await Leave.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave record not found' });
    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLeaves, applyLeave, updateLeave };
