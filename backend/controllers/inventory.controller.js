const fs = require('fs');
const path = require('path');
const Inventory = require('../models/Inventory.model');
const ExpenseReportDeletion = require('../models/ExpenseReportDeletion.model');
const { uploadOnCloudinary } = require('../utils/cloudinary');

// GET /api/inventory
// Condition is an Admin-only concern. Staff requests get condition-related
// fields stripped from the response so the staff UI never sees/edits them.
const STAFF_HIDDEN_FIELDS = '-condition -repairStatus -damageDescription -damageReportedBy -damageReportedAt -status';

const getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, block } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (block) filter.block = block;

    const isStaff = req.user?.role === 'staff';

    const total = await Inventory.countDocuments(filter);
    let query = Inventory.find(filter)
      .populate('block', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ name: 1 });

    if (isStaff) query = query.select(STAFF_HIDDEN_FIELDS);

    const items = await query;

    res.json({ success: true, data: items, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/inventory  (multipart/form-data — multer handles the file)
const createInventoryItem = async (req, res) => {
  try {
    const { name, category, description, totalQuantity, unit, block, condition, purchaseDate, purchasePrice, supplier } = req.body;
    if (!name || !category || totalQuantity == null) {
      return res.status(400).json({ success: false, message: 'name, category and totalQuantity are required' });
    }

    // Upload image to Cloudinary (util deletes the temp file in all cases).
    let image = '';
    if (req.file) {
      const result = await uploadOnCloudinary(req.file.path, 'hostel-management/inventory');
      if (!result?.secure_url) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      image = result.secure_url;
    }

    const price = purchasePrice ? Number(purchasePrice) : 0;

    const item = await Inventory.create({
      name, category, description,
      totalQuantity: Number(totalQuantity),
      availableQuantity: Number(totalQuantity),
      unit, block: block || undefined, condition,
      purchaseDate: purchaseDate || undefined,
      purchasePrice: price || undefined,
      supplier, image,
      // Log the initial purchase as an expense (drives the expense reports)
      expenseEntries: price > 0
        ? [{ category: 'purchase', amount: price, quantityAdded: Number(totalQuantity), date: purchaseDate || new Date() }]
        : [],
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/inventory/:id  (multipart/form-data — multer handles the file)
// Updates item details + totalQuantity (the fixed capacity limit)
// availableQuantity is NOT editable here — use /use or /add-stock instead
const updateInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    // totalQuantity is allowed, but availableQuantity is NOT
    const allowed = ['name', 'category', 'description', 'totalQuantity', 'unit', 'condition', 'supplier', 'purchaseDate', 'purchasePrice', 'block'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== '') {
        updates[key] = req.body[key];
      }
    }
    if (updates.block === '') delete updates.block;

    // Validate: new totalQuantity must not be less than current availableQuantity
    if (updates.totalQuantity !== undefined) {
      const newTotal = Number(updates.totalQuantity);
      if (newTotal < item.availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Total quantity (${newTotal}) cannot be less than current available quantity (${item.availableQuantity})`,
        });
      }
      updates.totalQuantity = newTotal;
    }

    // If a new image was uploaded, push it to Cloudinary (abort on failure)
    if (req.file) {
      const result = await uploadOnCloudinary(req.file.path, 'hostel-management/inventory');
      if (!result?.secure_url) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      updates.image = result.secure_url;
    }

    const updated = await Inventory.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('block', 'name');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/inventory/:id/use
const useInventoryItem = async (req, res) => {
  try {
    const { usedQuantity } = req.body;

    if (usedQuantity == null || Number(usedQuantity) <= 0) {
      return res.status(400).json({ success: false, message: 'usedQuantity must be a positive number' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    const qty = Number(usedQuantity);
    if (qty > item.availableQuantity) {
      return res.status(400).json({ success: false, message: `Cannot use ${qty}. Only ${item.availableQuantity} available.` });
    }

    item.availableQuantity -= qty;
    await item.save();

    const populated = await item.populate('block', 'name');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/inventory/:id/add-stock
// Refills availableQuantity toward the fixed totalQuantity limit — does NOT increase totalQuantity
const addStockInventoryItem = async (req, res) => {
  try {
    const { addedQuantity, cost } = req.body;

    if (addedQuantity == null || Number(addedQuantity) <= 0) {
      return res.status(400).json({ success: false, message: 'addedQuantity must be a positive number' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    const qty = Number(addedQuantity);
    const maxRefill = item.totalQuantity - item.availableQuantity;

    if (maxRefill <= 0) {
      return res.status(400).json({ success: false, message: 'Stock is already full. Available equals total quantity.' });
    }

    // Actual amount added (capped at the fixed total)
    const added = Math.min(qty, maxRefill);
    item.availableQuantity += added;

    // Log shortage-replenishment expense (drives the expense reports)
    const replenishCost = cost != null && cost !== '' ? Number(cost) : 0;
    item.expenseEntries.push({ category: 'shortage', amount: replenishCost, quantityAdded: added, date: new Date() });

    await item.save();

    const populated = await item.populate('block', 'name');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/inventory/:id  (permanent delete)
const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    // Delete the image file if it exists
    if (item.image) {
      const imgPath = path.join(__dirname, '..', item.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Item permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/inventory/:id/condition  (staff & admin)
const updateCondition = async (req, res) => {
  try {
    const { condition } = req.body;
    const validConditions = ['new', 'good', 'fair', 'poor', 'damaged'];
    if (!condition || !validConditions.includes(condition)) {
      return res.status(400).json({ success: false, message: `condition must be one of: ${validConditions.join(', ')}` });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    item.condition = condition;
    if (condition === 'damaged') {
      item.status = 'repair';
    }
    await item.save();

    const populated = await item.populate('block', 'name');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/inventory/:id/damaged  (staff & admin)
const markDamaged = async (req, res) => {
  try {
    const { damageDescription } = req.body;

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    item.condition = 'damaged';
    item.status = 'repair';
    item.repairStatus = 'pending';
    item.damageDescription = damageDescription || '';
    item.damageReportedBy = req.user._id;
    item.damageReportedAt = new Date();
    await item.save();

    const populated = await item.populate([
      { path: 'block', select: 'name' },
      { path: 'damageReportedBy', select: 'name' },
    ]);
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/inventory/:id/repair-status  (staff & admin)
const updateRepairStatus = async (req, res) => {
  try {
    const { repairStatus, repairCost } = req.body;
    const validStatuses = ['none', 'pending', 'in_progress', 'repaired', 'replaced'];
    if (!repairStatus || !validStatuses.includes(repairStatus)) {
      return res.status(400).json({ success: false, message: `repairStatus must be one of: ${validStatuses.join(', ')}` });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    item.repairStatus = repairStatus;
    // If repaired or replaced, restore condition to good
    if (repairStatus === 'repaired' || repairStatus === 'replaced') {
      item.condition = 'good';
      item.status = 'available';
    }

    // Log repair expense when a cost is recorded (drives the expense reports)
    if (repairCost != null && repairCost !== '' && Number(repairCost) > 0) {
      item.expenseEntries.push({ category: 'repair', amount: Number(repairCost), date: new Date() });
    }

    await item.save();

    const populated = await item.populate('block', 'name');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Expense report helpers ─────────────────────────────────────────────────
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Inventory expense per item = quantity × actual purchase price (nothing else).
// Repair/damage/shortage costs are explicitly excluded.
const itemExpense = {
  $multiply: [{ $ifNull: ['$totalQuantity', 0] }, { $ifNull: ['$purchasePrice', 0] }],
};

// Item-wise detail record pushed into each report group.
const itemDetail = {
  itemName: '$name',
  category: '$category',
  quantity: { $ifNull: ['$totalQuantity', 0] },
  purchasePrice: { $ifNull: ['$purchasePrice', 0] },
  totalCost: '$_expense',
  dateAdded: '$createdAt',
  supplier: '$supplier',
};

// GET /api/admin/inventory/reports/monthly
// One report per month with full item-wise breakdown. Periods the admin has
// deleted are excluded.
const getMonthlyExpenseReport = async (req, res) => {
  try {
    const [rows, deletions] = await Promise.all([
      Inventory.aggregate([
        { $addFields: { _expense: itemExpense } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            totalExpense: { $sum: '$_expense' },
            items: { $push: itemDetail },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
      ]),
      ExpenseReportDeletion.find({ type: 'monthly' }).lean(),
    ]);

    const deleted = new Set(deletions.map((d) => `${d.year}-${d.month}`));

    const data = rows
      .filter((r) => !deleted.has(`${r._id.year}-${r._id.month}`))
      .map((r) => {
        const { year, month } = r._id;
        return {
          year,
          month,
          monthName: MONTH_NAMES[month - 1],
          label: `${MONTH_NAMES[month - 1]} ${year}`,
          monthStart: new Date(year, month - 1, 1),
          monthEnd: new Date(year, month, 0, 23, 59, 59, 999),
          totalExpense: r.totalExpense,
          items: r.items,
        };
      });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/inventory/reports/yearly
// One report per year with month-by-month breakdown + item-wise records.
// New years appear automatically; admin-deleted years are excluded.
const getYearlyExpenseReport = async (req, res) => {
  try {
    const [yearRows, monthRows, deletions] = await Promise.all([
      Inventory.aggregate([
        { $addFields: { _expense: itemExpense } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' } },
            totalExpense: { $sum: '$_expense' },
            items: { $push: itemDetail },
          },
        },
        { $sort: { '_id.year': -1 } },
      ]),
      Inventory.aggregate([
        { $addFields: { _expense: itemExpense } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            totalExpense: { $sum: '$_expense' },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]),
      ExpenseReportDeletion.find({ type: 'yearly' }).lean(),
    ]);

    const deletedYears = new Set(deletions.map((d) => d.year));

    const data = yearRows
      .filter((r) => !deletedYears.has(r._id.year))
      .map((r) => {
        const { year } = r._id;
        const monthlyBreakdown = monthRows
          .filter((m) => m._id.year === year)
          .map((m) => ({
            month: m._id.month,
            monthName: MONTH_NAMES[m._id.month - 1],
            label: `${MONTH_NAMES[m._id.month - 1]} ${year}`,
            totalExpense: m.totalExpense,
          }));
        return {
          year,
          label: String(year),
          yearStart: new Date(year, 0, 1),
          yearEnd: new Date(year, 11, 31, 23, 59, 59, 999),
          totalExpense: r.totalExpense,
          monthlyBreakdown,
          items: r.items,
        };
      });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/inventory/reports/monthly/:year/:month — permanent
const deleteMonthlyReport = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Valid year and month are required' });
    }
    await ExpenseReportDeletion.updateOne(
      { type: 'monthly', year, month },
      { $set: { type: 'monthly', year, month } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Monthly report deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/inventory/reports/yearly/:year — permanent
const deleteYearlyReport = async (req, res) => {
  try {
    const year = Number(req.params.year);
    if (!year) return res.status(400).json({ success: false, message: 'Valid year is required' });
    await ExpenseReportDeletion.updateOne(
      { type: 'yearly', year },
      { $set: { type: 'yearly', year } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Yearly report deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getInventory, createInventoryItem, updateInventoryItem, useInventoryItem,
  addStockInventoryItem, deleteInventoryItem,
  updateCondition, markDamaged, updateRepairStatus,
  getMonthlyExpenseReport, getYearlyExpenseReport,
  deleteMonthlyReport, deleteYearlyReport,
};
