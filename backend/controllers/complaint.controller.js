const Complaint = require('../models/Complaint.model');
const Student = require('../models/Student.model');

// GET /api/complaints
const getComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // Students can only see their own
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) filter.student = student._id;
    }

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('assignedStaff', 'name email')
      .populate('block', 'name')
      .populate('room', 'roomNumber')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, data: complaints, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/complaints/:id
const getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('assignedStaff', 'name email')
      .populate('block', 'name')
      .populate('room', 'roomNumber');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/complaints
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'title, description and category are required' });
    }

    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const complaint = await Complaint.create({
      student: student._id,
      title,
      description,
      category,
      priority,
      block: student.block,
      room: student.room,
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/complaints/:id
const updateComplaint = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    if (status) complaint.status = status;
    if (remarks !== undefined) complaint.remarks = remarks;
    if (status === 'resolved' || status === 'closed') complaint.resolvedAt = new Date();

    await complaint.save();

    const populated = await complaint
      .populate([
        { path: 'student', populate: { path: 'user', select: 'name email' } },
        { path: 'assignedStaff', select: 'name email' },
        { path: 'block', select: 'name' },
        { path: 'room', select: 'roomNumber' },
      ]);
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/complaints/:id
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/complaints/:id/status
const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    complaint.status = status;
    if (status === 'resolved' || status === 'closed') complaint.resolvedAt = new Date();
    await complaint.save();

    const populated = await complaint.populate([
      { path: 'student', populate: { path: 'user', select: 'name email' } },
      { path: 'assignedStaff', select: 'name email' },
      { path: 'block', select: 'name' },
      { path: 'room', select: 'roomNumber' },
    ]);

    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getComplaints, getComplaint, createComplaint, updateComplaint, updateComplaintStatus, deleteComplaint };
