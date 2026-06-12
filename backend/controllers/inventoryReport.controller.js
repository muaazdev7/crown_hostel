const InventoryReport = require('../models/InventoryReport.model');
const Inventory = require('../models/Inventory.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');

// ── Helpers ───────────────────────────────────────────────────────────────

// Notify every active admin that a new report needs attention.
const notifyAdmins = async ({ title, message }) => {
  const admins = await User.find({ role: 'admin', status: 'active' }).select('_id').lean();
  if (!admins.length) return;
  await Notification.insertMany(
    admins.map((a) => ({
      recipient: a._id,
      title,
      message,
      type: 'inventory',
      link: '/admin/inventory',
    }))
  );
};

// Notify the reporting staff member that the admin has responded.
const notifyReporter = async ({ recipient, title, message }) => {
  await Notification.create({
    recipient,
    title,
    message,
    type: 'inventory',
    link: '/staff/inventory',
  });
};

// Convert a stored multer file path to a web-served /uploads/... path.
const toWebPath = (file) =>
  file ? file.path.replace(/\\/g, '/').replace(/^.*uploads/, 'uploads') : '';

// ── Feature 1: POST /api/inventory/shortage-report (staff & admin) ──────────
const createShortageReport = async (req, res) => {
  try {
    const { itemId, reportedQuantity, description } = req.body;

    if (!itemId || !description) {
      return res.status(400).json({ success: false, message: 'itemId and description are required' });
    }

    const item = await Inventory.findById(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    const report = await InventoryReport.create({
      reportType: 'SHORTAGE',
      item: item._id,
      itemName: item.name,
      currentQuantity: item.availableQuantity,
      reportedQuantity: reportedQuantity != null && reportedQuantity !== '' ? Number(reportedQuantity) : undefined,
      description,
      reportedBy: req.user._id,
      reportedByName: req.user.name,
      status: 'pending',
    });

    await notifyAdmins({
      title: 'New Inventory Shortage Report',
      message: `${req.user.name} reported a shortage for "${item.name}".`,
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Feature 2: POST /api/inventory/damage-report (staff & admin) ────────────
// multipart/form-data — multer (uploadInventory) handles the optional image
const createDamageReport = async (req, res) => {
  try {
    const { itemId, description, severity } = req.body;

    if (!itemId || !description) {
      return res.status(400).json({ success: false, message: 'itemId and description are required' });
    }
    const validSeverity = ['minor', 'moderate', 'severe'];
    if (severity && !validSeverity.includes(severity)) {
      return res.status(400).json({ success: false, message: `severity must be one of: ${validSeverity.join(', ')}` });
    }

    const item = await Inventory.findById(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    const report = await InventoryReport.create({
      reportType: 'DAMAGE',
      item: item._id,
      itemName: item.name,
      description,
      severity: severity || 'minor',
      image: toWebPath(req.file),
      reportedBy: req.user._id,
      reportedByName: req.user.name,
      status: 'pending',
    });

    // Reflect the damage on the inventory item immediately so it shows as "repair"
    item.condition = 'damaged';
    item.status = 'repair';
    item.repairStatus = 'pending';
    item.damageDescription = description;
    item.damageReportedBy = req.user._id;
    item.damageReportedAt = new Date();
    await item.save();

    await notifyAdmins({
      title: 'New Inventory Damage Report',
      message: `${req.user.name} reported ${severity || 'minor'} damage to "${item.name}".`,
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Feature 3: GET /api/inventory/my-reports (staff) ────────────────────────
const getMyReports = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { reportedBy: req.user._id };
    if (type) filter.reportType = String(type).toUpperCase();

    const reports = await InventoryReport.find(filter)
      .populate('item', 'name category image')
      .populate('respondedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Feature 4: GET /api/admin/inventory-reports (admin) ─────────────────────
const getAllReports = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (type) filter.reportType = String(type).toUpperCase();
    if (status) filter.status = status;

    const total = await InventoryReport.countDocuments(filter);
    const reports = await InventoryReport.find(filter)
      .populate('item', 'name category image availableQuantity totalQuantity unit condition repairStatus')
      .populate('reportedBy', 'name email')
      .populate('respondedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({ success: true, data: reports, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Feature 5: PUT /api/admin/inventory-reports/:id/respond (admin) ─────────
// Shortage workflow: pending → in_review → resolved (or rejected)
// On "resolved", optionally restock the inventory item.
const respondToShortageReport = async (req, res) => {
  try {
    const { status, adminResponse, restockQuantity } = req.body;
    const valid = ['in_review', 'resolved', 'rejected'];
    if (!status || !valid.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${valid.join(', ')}` });
    }

    const report = await InventoryReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (report.reportType !== 'SHORTAGE') {
      return res.status(400).json({ success: false, message: 'This endpoint only handles SHORTAGE reports. Use /action for damage reports.' });
    }

    // Auto-update inventory quantity when resolving with a restock amount
    if (status === 'resolved' && restockQuantity != null && Number(restockQuantity) > 0) {
      const item = await Inventory.findById(report.item);
      if (item) {
        const add = Number(restockQuantity);
        item.availableQuantity += add;
        // A genuine restock may push us above the old capacity — raise it to match.
        if (item.availableQuantity > item.totalQuantity) {
          item.totalQuantity = item.availableQuantity;
        }
        await item.save();
      }
    }

    report.status = status;
    report.adminResponse = adminResponse || report.adminResponse;
    report.respondedBy = req.user._id;
    report.responseDate = new Date();
    await report.save();

    const statusLabel = status.replace('_', ' ');
    await notifyReporter({
      recipient: report.reportedBy,
      title: 'Shortage Report Update',
      message: `Your shortage report for "${report.itemName}" is now ${statusLabel}.`,
    });

    const populated = await report.populate([
      { path: 'item', select: 'name availableQuantity totalQuantity unit' },
      { path: 'respondedBy', select: 'name' },
    ]);
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Feature 6 + 7: PUT /api/admin/inventory-reports/:id/action (admin) ──────
// Damage workflow: pending → in_review → repair_scheduled → repaired | replaced (or rejected)
// Automatic inventory updates on repaired / replaced.
const actionDamageReport = async (req, res) => {
  try {
    const { status, adminResponse, restockQuantity } = req.body;
    const valid = ['in_review', 'repair_scheduled', 'repaired', 'replaced', 'rejected'];
    if (!status || !valid.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${valid.join(', ')}` });
    }

    const report = await InventoryReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (report.reportType !== 'DAMAGE') {
      return res.status(400).json({ success: false, message: 'This endpoint only handles DAMAGE reports. Use /respond for shortage reports.' });
    }

    const item = await Inventory.findById(report.item);
    if (item) {
      switch (status) {
        case 'repair_scheduled':
          item.status = 'repair';
          item.repairStatus = 'in_progress';
          break;
        case 'repaired':
          item.condition = 'good';
          item.status = 'available';
          item.repairStatus = 'repaired';
          break;
        case 'replaced':
          item.condition = 'good';
          item.status = 'available';
          item.repairStatus = 'replaced';
          // A replacement may add fresh stock
          if (restockQuantity != null && Number(restockQuantity) > 0) {
            item.availableQuantity += Number(restockQuantity);
            if (item.availableQuantity > item.totalQuantity) {
              item.totalQuantity = item.availableQuantity;
            }
          }
          break;
        case 'rejected':
          // Damage was not valid — restore the item to a usable state
          item.condition = 'good';
          item.status = 'available';
          item.repairStatus = 'none';
          break;
        // in_review: leave the item in its current 'repair' state
      }
      await item.save();
    }

    report.status = status;
    report.adminResponse = adminResponse || report.adminResponse;
    report.respondedBy = req.user._id;
    report.responseDate = new Date();
    await report.save();

    const statusLabel = status.replace('_', ' ');
    await notifyReporter({
      recipient: report.reportedBy,
      title: 'Damage Report Update',
      message: `Your damage report for "${report.itemName}" is now ${statusLabel}.`,
    });

    const populated = await report.populate([
      { path: 'item', select: 'name condition repairStatus availableQuantity totalQuantity unit' },
      { path: 'respondedBy', select: 'name' },
    ]);
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createShortageReport,
  createDamageReport,
  getMyReports,
  getAllReports,
  respondToShortageReport,
  actionDamageReport,
};
