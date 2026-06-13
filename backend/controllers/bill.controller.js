const Bill = require('../models/Bill.model');
const { uploadOnCloudinary } = require('../utils/cloudinary');

const BILL_TYPES = [
  'electricity', 'internet', 'water', 'gas', 'generator_fuel',
  'maintenance_services', 'security_services', 'waste_management', 'other',
];

// Generate a unique bill number: BILL-YYYYMM-XXXX
const generateBillNumber = async () => {
  const now = new Date();
  const prefix = `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const count = await Bill.countDocuments({ billNumber: { $regex: `^${prefix}` } });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

// ── POST /api/bills  (warden & admin) — multipart, optional attachment ─────
const createBill = async (req, res) => {
  try {
    const {
      billNumber, billType, serviceProvider, referenceNumber,
      amount, taxAmount, billingDate, dueDate, paymentDate,
      paymentStatus, description, remarks,
    } = req.body;

    if (!billType || !serviceProvider || amount == null || !billingDate) {
      return res.status(400).json({ success: false, message: 'billType, serviceProvider, amount and billingDate are required' });
    }

    const amt = Number(amount);
    const tax = taxAmount != null && taxAmount !== '' ? Number(taxAmount) : 0;

    // Optional receipt/bill file → Cloudinary (abort on failure)
    let attachment = '';
    if (req.file) {
      const result = await uploadOnCloudinary(req.file.path, 'hostel-management/bills');
      if (!result?.secure_url) {
        return res.status(500).json({ success: false, message: 'Attachment upload failed' });
      }
      attachment = result.secure_url;
    }

    const bill = await Bill.create({
      billNumber: billNumber?.trim() || await generateBillNumber(),
      billType, serviceProvider, referenceNumber,
      amount: amt,
      taxAmount: tax,
      totalAmount: amt + tax,
      billingDate,
      dueDate: dueDate || undefined,
      paymentDate: paymentDate || undefined,
      paymentStatus: paymentStatus || 'pending',
      description, remarks,
      attachment,
      createdBy: req.user._id,
    });

    const populated = await bill.populate('createdBy', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A bill with this number already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bills  (warden & admin) — filters + search + pagination ───────
const getBills = async (req, res) => {
  try {
    const {
      page = 1, limit = 50, billType, serviceProvider, paymentStatus,
      month, year, from, to, search,
    } = req.query;

    const filter = {};
    if (billType) filter.billType = billType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (serviceProvider) filter.serviceProvider = { $regex: serviceProvider, $options: 'i' };

    // Date range on billingDate
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    if (year) {
      const y = Number(year);
      const m = month ? Number(month) - 1 : null;
      if (m != null) {
        dateFilter.$gte = new Date(y, m, 1);
        dateFilter.$lte = new Date(y, m + 1, 0, 23, 59, 59);
      } else {
        dateFilter.$gte = new Date(y, 0, 1);
        dateFilter.$lte = new Date(y, 11, 31, 23, 59, 59);
      }
    }
    if (Object.keys(dateFilter).length) filter.billingDate = dateFilter;

    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { serviceProvider: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Bill.countDocuments(filter);
    const bills = await Bill.find(filter)
      .populate('createdBy', 'name')
      .sort({ billingDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: bills, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bills/stats  (warden & admin) — dashboard cards ───────────────
const getBillStats = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const sum = async (match) => {
      const r = await Bill.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]);
      return r[0]?.total || 0;
    };

    const [
      totalBills, pendingBills, paidBills, overdueBills,
      currentMonthExpenses, totalAnnualExpenses, recentBills,
    ] = await Promise.all([
      Bill.countDocuments(),
      Bill.countDocuments({ paymentStatus: 'pending' }),
      Bill.countDocuments({ paymentStatus: 'paid' }),
      Bill.countDocuments({ paymentStatus: 'overdue' }),
      sum({ billingDate: { $gte: monthStart, $lte: monthEnd } }),
      sum({ billingDate: { $gte: yearStart, $lte: yearEnd } }),
      Bill.find().populate('createdBy', 'name').sort({ createdAt: -1 }).limit(8),
    ]);

    res.json({
      success: true,
      data: {
        totalBills, pendingBills, paidBills, overdueBills,
        currentMonthExpenses, totalAnnualExpenses,
        recentBills,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bills/:id  (warden & admin) ───────────────────────────────────
const getBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('createdBy', 'name');
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, data: bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/bills/:id  (warden & admin) — multipart, optional attachment ──
const updateBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const allowed = [
      'billNumber', 'billType', 'serviceProvider', 'referenceNumber',
      'amount', 'taxAmount', 'billingDate', 'dueDate', 'paymentDate',
      'paymentStatus', 'description', 'remarks',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== '') bill[key] = req.body[key];
    }
    // Keep totalAmount consistent
    bill.totalAmount = Number(bill.amount) + Number(bill.taxAmount || 0);

    // Replace attachment if a new file was uploaded → Cloudinary (abort on fail)
    if (req.file) {
      const result = await uploadOnCloudinary(req.file.path, 'hostel-management/bills');
      if (!result?.secure_url) {
        return res.status(500).json({ success: false, message: 'Attachment upload failed' });
      }
      bill.attachment = result.secure_url;
    }

    await bill.save();
    const populated = await bill.populate('createdBy', 'name');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/bills/:id  (admin only) ────────────────────────────────────
const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    // Attachment lives on Cloudinary; just remove the DB record.
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bills/reports/monthly  (admin) — per-month, per-category ──────
const getMonthlyReport = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const rows = await Bill.aggregate([
      { $match: { billingDate: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { month: { $month: '$billingDate' }, billType: '$billType' },
          total: { $sum: '$totalAmount' },
          paid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
        },
      },
    ]);

    // Build 12-month structure
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      categories: {},
      total: 0,
      paid: 0,
      outstanding: 0,
    }));

    for (const r of rows) {
      const m = months[r._id.month - 1];
      m.categories[r._id.billType] = (m.categories[r._id.billType] || 0) + r.total;
      m.total += r.total;
      m.paid += r.paid;
    }
    months.forEach((m) => { m.outstanding = m.total - m.paid; });

    res.json({ success: true, data: { year, months } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bills/reports/yearly  (admin) — annual analytics ──────────────
const getYearlyReport = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    const match = { billingDate: { $gte: start, $lte: end } };

    const [totals, byMonth, byCategory] = await Promise.all([
      Bill.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
            paid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
            count: { $sum: 1 },
          },
        },
      ]),
      Bill.aggregate([
        { $match: match },
        { $group: { _id: { $month: '$billingDate' }, total: { $sum: '$totalAmount' } } },
      ]),
      Bill.aggregate([
        { $match: match },
        { $group: { _id: '$billType', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }));
    byMonth.forEach((r) => { monthlyBreakdown[r._id - 1].total = r.total; });

    const categoryBreakdown = byCategory.map((c) => ({ billType: c._id, total: c.total, count: c.count }));

    res.json({
      success: true,
      data: {
        year,
        totalAnnualExpenses: totals[0]?.total || 0,
        paidAmount: totals[0]?.paid || 0,
        outstandingAmount: (totals[0]?.total || 0) - (totals[0]?.paid || 0),
        billCount: totals[0]?.count || 0,
        monthlyBreakdown,
        categoryBreakdown,
        mostExpensiveCategories: categoryBreakdown.slice(0, 3),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  BILL_TYPES,
  createBill, getBills, getBillStats, getBill, updateBill, deleteBill,
  getMonthlyReport, getYearlyReport,
};
