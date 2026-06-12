const VisitorRequest = require('../models/VisitorRequest.model');
const Student = require('../models/Student.model');
const Staff = require('../models/Staff.model');
const Notification = require('../models/Notification.model');

const notify = (recipient, title, message, link) =>
  Notification.create({ recipient, title, message, type: 'general', link });

// Notify every Warden that a new request needs review
const notifyWardens = async (title, message) => {
  const wardens = await Staff.find({ designation: 'Warden' }).select('user').lean();
  const recipients = wardens.map((w) => w.user).filter(Boolean);
  if (!recipients.length) return;
  await Notification.insertMany(
    recipients.map((user) => ({ recipient: user, title, message, type: 'general', link: '/staff/visitors' }))
  );
};

// ── POST /api/visitor-requests  (student) ──────────────────────────────────
const createVisitorRequest = async (req, res) => {
  try {
    const { visitorName, visitorCNIC, visitorPhone, relationship, visitDate, visitTime, purpose } = req.body;
    if (!visitorName || !visitorPhone || !visitDate) {
      return res.status(400).json({ success: false, message: 'visitorName, visitorPhone and visitDate are required' });
    }

    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'name')
      .populate('room', 'roomNumber');
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const request = await VisitorRequest.create({
      student: student._id,
      studentUser: req.user._id,
      studentName: student.user?.name || req.user.name,
      registrationNumber: student.rollNumber,
      roomNumber: student.room?.roomNumber || '',
      visitorName, visitorCNIC, visitorPhone, relationship,
      visitDate, visitTime, purpose,
      status: 'pending',
    });

    await notifyWardens(
      'New Visitor Request',
      `${request.studentName} (Room ${request.roomNumber || '—'}) requested a visit from ${visitorName}.`
    );

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/visitor-requests/my-requests  (student) ───────────────────────
const getMyVisitorRequests = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const requests = await VisitorRequest.find({ student: student._id })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/visitor-requests/pending  (warden/admin) ──────────────────────
// Returns all requests (optionally filtered by status) for warden review.
const getVisitorRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const requests = await VisitorRequest.find(filter)
      .populate('approvedBy', 'name')
      .populate({ path: 'student', select: 'rollNumber', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Shared approve/reject handler
const respond = (newStatus) => async (req, res) => {
  try {
    const { wardenResponse } = req.body;
    const request = await VisitorRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: newStatus,
        wardenResponse: wardenResponse || '',
        approvedBy: req.user._id,
        approvedAt: new Date(),
      },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Visitor request not found' });

    if (request.studentUser) {
      await notify(
        request.studentUser,
        `Visitor Request ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
        `Your visitor request for ${request.visitorName} was ${newStatus}.`,
        '/student/visitors'
      );
    }

    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/admin/visitors/:id  (admin) ────────────────────────────────
const deleteVisitorRequest = async (req, res) => {
  try {
    const request = await VisitorRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Visitor request not found' });
    res.json({ success: true, message: 'Visitor log deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createVisitorRequest,
  getMyVisitorRequests,
  getVisitorRequests,
  approveVisitorRequest: respond('approved'),
  rejectVisitorRequest: respond('rejected'),
  deleteVisitorRequest,
};
