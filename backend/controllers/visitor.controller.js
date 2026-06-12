const Visitor = require('../models/Visitor.model');

const populateVisitor = (q) =>
  q.populate({
    path: 'visitingStudent',
    select: 'rollNumber room user',
    populate: [
      { path: 'user', select: 'name' },
      { path: 'room', select: 'roomNumber' },
    ],
  }).populate('approvedBy', 'name');

// GET /api/visitors — list visitor records (Warden only)
const getVisitors = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Visitor.countDocuments(filter);
    const visitors = await populateVisitor(
      Visitor.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
    );

    res.json({ success: true, data: visitors, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/visitors — register a new visitor (Warden only)
const createVisitor = async (req, res) => {
  try {
    const { name, phone, visitingStudent, relation, purpose, idType, idNumber } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Visitor name and phone are required' });
    }

    const visitor = await Visitor.create({
      name, phone,
      visitingStudent: visitingStudent || undefined,
      relation, purpose, idType, idNumber,
      status: 'pending',
    });

    const populated = await populateVisitor(Visitor.findById(visitor._id));
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/visitors/:id — update visitor details / check-out (Warden only)
const updateVisitor = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'visitingStudent', 'relation', 'purpose', 'idType', 'idNumber', 'checkOut'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.visitingStudent === '') delete updates.visitingStudent;

    const visitor = await populateVisitor(
      Visitor.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    );
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    res.json({ success: true, data: visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/visitors/:id — remove a visitor record (Warden only)
const deleteVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndDelete(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    res.json({ success: true, message: 'Visitor record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/visitors/:id/approve — approve a visitor (Warden only)
const approveVisitor = async (req, res) => {
  try {
    const visitor = await populateVisitor(
      Visitor.findByIdAndUpdate(
        req.params.id,
        { status: 'approved', approvedBy: req.user._id, approvedAt: new Date(), rejectionReason: undefined },
        { new: true }
      )
    );
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    res.json({ success: true, data: visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/visitors/:id/reject — reject a visitor (Warden only)
const rejectVisitor = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const visitor = await populateVisitor(
      Visitor.findByIdAndUpdate(
        req.params.id,
        { status: 'rejected', approvedBy: req.user._id, approvedAt: new Date(), rejectionReason: rejectionReason || '' },
        { new: true }
      )
    );
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    res.json({ success: true, data: visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getVisitors, createVisitor, updateVisitor, deleteVisitor, approveVisitor, rejectVisitor,
};
