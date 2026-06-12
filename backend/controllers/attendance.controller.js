const Attendance = require('../models/Attendance.model');
const Student = require('../models/Student.model');

// GET /api/attendance
const getAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 50, date, studentId, status } = req.query;
    const filter = {};
    if (date) {
      const d = new Date(date);
      filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
    }
    if (studentId) filter.student = studentId;
    if (status) filter.status = status;

    // Student can only view their own
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) filter.student = student._id;
    }

    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
      .populate('markedBy', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ date: -1 });

    res.json({ success: true, data: records, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance  (bulk mark for a date)
const markAttendance = async (req, res) => {
  try {
    const { records, date } = req.body;
    // records = [{ studentId, status, remarks }]
    if (!records || !Array.isArray(records) || !date) {
      return res.status(400).json({ success: false, message: 'records array and date are required' });
    }

    const results = [];
    for (const record of records) {
      const doc = await Attendance.findOneAndUpdate(
        { student: record.studentId, date: new Date(date) },
        { status: record.status, remarks: record.remarks, markedBy: req.user._id },
        { upsert: true, new: true }
      );
      results.push(doc);
    }

    res.status(201).json({ success: true, data: results, count: results.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/attendance/:id
const updateAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAttendance, markAttendance, updateAttendance };
