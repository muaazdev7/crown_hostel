const MaintenanceRequest = require('../models/MaintenanceRequest.model');
const Student = require('../models/Student.model');
const Staff = require('../models/Staff.model');
const Notification = require('../models/Notification.model');

const toWebPath = (file) =>
  file ? file.path.replace(/\\/g, '/').replace(/^.*uploads/, 'uploads') : '';

const populateRequest = (q) =>
  q.populate({ path: 'assignedStaff', populate: { path: 'user', select: 'name' } })
   .populate('room', 'roomNumber floor');

// Notify a single user
const notify = (recipient, title, message, link) =>
  Notification.create({ recipient, title, message, type: 'general', link });

// ── POST /api/maintenance  (student) — multipart, optional image ───────────
// Student explicitly selects the designation + staff member to assign to.
const createMaintenanceRequest = async (req, res) => {
  try {
    const { category, issueTitle, issueDescription, priority, assignedDesignation, assignedStaffId } = req.body;
    if (!category || !issueTitle || !issueDescription) {
      return res.status(400).json({ success: false, message: 'category, issueTitle and issueDescription are required' });
    }
    if (!assignedDesignation || !assignedStaffId) {
      return res.status(400).json({ success: false, message: 'assignedDesignation and assignedStaffId are required' });
    }

    // Resolve the student profile + snapshots from the authenticated user
    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'name')
      .populate('room', 'roomNumber');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Resolve the selected staff member
    const selectedStaff = await Staff.findById(assignedStaffId).populate('user', 'name');
    if (!selectedStaff || selectedStaff.designation !== assignedDesignation) {
      return res.status(400).json({ success: false, message: 'Selected staff member is invalid for this designation' });
    }

    const request = await MaintenanceRequest.create({
      student: student._id,
      studentUser: req.user._id,
      studentName: student.user?.name || req.user.name,
      registrationNumber: student.rollNumber,
      roomNumber: student.room?.roomNumber || '',
      room: student.room?._id,
      category,
      issueTitle,
      issueDescription,
      priority: priority || 'medium',
      image: toWebPath(req.file),
      assignedDesignation,
      assignedStaff: selectedStaff._id,
      assignedStaffName: selectedStaff.user?.name || '',
      status: 'assigned',
    });

    // Notify the selected staff member
    if (selectedStaff.user) {
      await notify(
        selectedStaff.user._id,
        'New Maintenance Request',
        `${request.studentName} (Room ${request.roomNumber || '—'}) reported: ${issueTitle}`,
        '/staff/maintenance'
      );
    }

    const populated = await populateRequest(MaintenanceRequest.findById(request._id));
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/maintenance/my-requests  (student) ────────────────────────────
const getMyRequests = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const requests = await populateRequest(
      MaintenanceRequest.find({ student: student._id }).sort({ createdAt: -1 })
    );
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/maintenance/assigned  (staff) ─────────────────────────────────
// Staff see ONLY requests assigned specifically to them (assignedStaff = me).
const getAssignedRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff profile not found' });

    const filter = { assignedStaff: staff._id };
    if (status) filter.status = status;

    const requests = await populateRequest(
      MaintenanceRequest.find(filter).sort({ priority: -1, createdAt: -1 })
    );
    res.json({ success: true, data: requests, designation: staff.designation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/maintenance  (admin) — all requests / reports ─────────────────
const getMaintenanceRequests = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, priority, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const total = await MaintenanceRequest.countDocuments(filter);
    const requests = await populateRequest(
      MaintenanceRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
    );
    res.json({ success: true, data: requests, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/maintenance/:id/status  (staff & admin) ───────────────────────
// Handles Accept / Start Work / Mark Completed / Reject + Add Notes.
const updateStatus = async (req, res) => {
  try {
    const { status, staffNotes } = req.body;
    const valid = ['assigned', 'in_progress', 'completed', 'rejected'];
    if (status && !valid.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${valid.join(', ')}` });
    }

    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // If a staff member acts on it, ensure the request is assigned to them
    if (req.user.role === 'staff') {
      const staff = await Staff.findOne({ user: req.user._id });
      if (!staff || String(request.assignedStaff) !== String(staff._id)) {
        return res.status(403).json({ success: false, message: 'This request is not assigned to you' });
      }
    }

    if (status) request.status = status;
    if (staffNotes !== undefined) request.staffNotes = staffNotes;
    if (status === 'completed') request.completedAt = new Date();

    await request.save();

    // Notify the student of the update
    if (request.studentUser) {
      await notify(
        request.studentUser,
        'Maintenance Request Updated',
        `Your request "${request.issueTitle}" is now ${request.status.replace('_', ' ')}.`,
        '/student/maintenance'
      );
    }

    const populated = await populateRequest(MaintenanceRequest.findById(request._id));
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/admin/maintenance/:id/cancel  (admin) ─────────────────────────
const cancelMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    const populated = await populateRequest(MaintenanceRequest.findById(request._id));
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/maintenance/:id  (admin) ───────────────────────────────────
const deleteMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, message: 'Maintenance request deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createMaintenanceRequest,
  getMyRequests,
  getAssignedRequests,
  getMaintenanceRequests,
  updateStatus,
  cancelMaintenanceRequest,
  deleteMaintenanceRequest,
};
