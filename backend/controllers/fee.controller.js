const FeeStructure = require('../models/FeeStructure.model');
const Invoice = require('../models/Invoice.model');
const Payment = require('../models/Payment.model');
const Student = require('../models/Student.model');

// ── Fee Structures ──────────────────────────────────────────────

// GET /api/fees/structures
const getFeeStructures = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeOnly !== 'false') filter.isActive = true;
    const structures = await FeeStructure.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: structures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/fees/structures
const createFeeStructure = async (req, res) => {
  try {
    const { name, type, roomType, baseFee, securityDeposit, lateFineRules, additionalCharges, components, academicYear } = req.body;
    if (!name || !baseFee || !academicYear) {
      return res.status(400).json({ success: false, message: 'name, baseFee and academicYear are required' });
    }
    const structure = await FeeStructure.create({
      name,
      type: type || 'monthly',
      roomType: roomType || undefined,
      baseFee: Number(baseFee),
      securityDeposit: Number(securityDeposit) || 0,
      lateFineRules: lateFineRules || {},
      additionalCharges: additionalCharges || {},
      components: components || [],
      academicYear,
    });
    res.status(201).json({ success: true, data: structure });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/fees/structures/:id
const updateFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.findById(req.params.id);
    if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found' });

    const allowed = ['name', 'type', 'roomType', 'baseFee', 'securityDeposit', 'lateFineRules', 'additionalCharges', 'components', 'academicYear', 'isActive'];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) structure[key] = req.body[key];
    });

    await structure.save();
    res.json({ success: true, data: structure });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/fees/structures/:id
const deleteFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.findByIdAndDelete(req.params.id);
    if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found' });
    res.json({ success: true, message: 'Fee structure deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Invoices ────────────────────────────────────────────────────

// GET /api/fees/invoices
const getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, studentId, academicYear } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (academicYear) filter.academicYear = academicYear;

    // Students can only see their own invoices
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) filter.student = student._id;
      else return res.json({ success: true, data: [], total: 0, page: 1, pages: 0 });
    } else if (studentId) {
      filter.student = studentId;
    }

    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('feeStructure', 'name type roomType baseFee securityDeposit lateFineRules components')
      .populate('generatedBy', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, data: invoices, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/fees/invoices
const createInvoice = async (req, res) => {
  try {
    const { studentId, feeStructureId, totalAmount, discount, dueDate, description, academicYear } = req.body;
    if (!studentId || !dueDate) {
      return res.status(400).json({ success: false, message: 'studentId and dueDate are required' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    let computedTotal = Number(totalAmount) || 0;
    let fine = 0;

    // Auto-calculate from fee structure if provided
    if (feeStructureId) {
      const fs = await FeeStructure.findById(feeStructureId);
      if (!fs) return res.status(404).json({ success: false, message: 'Fee structure not found' });
      if (!computedTotal) {
        const componentsTotal = (fs.components || []).reduce((sum, c) => sum + c.amount, 0);
        const additionalTotal = Object.values(fs.additionalCharges || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);
        computedTotal = fs.baseFee + fs.securityDeposit + componentsTotal + additionalTotal;
      }
    }

    if (computedTotal <= 0) {
      return res.status(400).json({ success: false, message: 'totalAmount must be greater than 0' });
    }

    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await Invoice.create({
      student: studentId,
      feeStructure: feeStructureId || undefined,
      invoiceNumber,
      totalAmount: computedTotal,
      discount: Number(discount) || 0,
      fine,
      dueDate,
      description,
      academicYear,
      generatedBy: req.user._id,
    });

    const populated = await invoice.populate([
      { path: 'student', populate: { path: 'user', select: 'name email' } },
      { path: 'feeStructure', select: 'name' },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/fees/invoices/:id
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const { discount, fine, dueDate, description, status } = req.body;
    if (discount !== undefined) invoice.discount = Number(discount);
    if (fine !== undefined) invoice.fine = Number(fine);
    if (dueDate !== undefined) invoice.dueDate = dueDate;
    if (description !== undefined) invoice.description = description;
    if (status) invoice.status = status;

    await invoice.save();

    const populated = await invoice.populate([
      { path: 'student', populate: { path: 'user', select: 'name email' } },
      { path: 'feeStructure', select: 'name' },
    ]);

    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/fees/invoices/:id
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.paidAmount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete an invoice with recorded payments' });
    }
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Payments ────────────────────────────────────────────────────

// GET /api/fees/payments
const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, studentId } = req.query;
    const filter = {};

    // Students can only see their own payments
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) filter.student = student._id;
      else return res.json({ success: true, data: [], total: 0, page: 1, pages: 0 });
    } else if (studentId) {
      filter.student = studentId;
    }

    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('invoice', 'invoiceNumber totalAmount description')
      .populate('recordedBy', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, data: payments, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/fees/payments
const recordPayment = async (req, res) => {
  try {
    const { invoiceId, studentId, amount, paymentMode, transactionId, remarks } = req.body;
    if (!invoiceId || !studentId || !amount || !paymentMode) {
      return res.status(400).json({ success: false, message: 'invoiceId, studentId, amount and paymentMode are required' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const outstanding = invoice.totalAmount + invoice.fine - invoice.discount - invoice.paidAmount;
    if (Number(amount) > outstanding) {
      return res.status(400).json({ success: false, message: `Amount (${amount}) exceeds outstanding balance (${outstanding})` });
    }

    // Auto-apply late fine if due date has passed and no fine yet
    if (invoice.fine === 0 && invoice.feeStructure) {
      const fs = await FeeStructure.findById(invoice.feeStructure);
      if (fs && fs.lateFineRules && fs.lateFineRules.finePerDay > 0) {
        const now = new Date();
        const due = new Date(invoice.dueDate);
        const graceMs = (fs.lateFineRules.gracePeriodDays || 0) * 86400000;
        if (now > new Date(due.getTime() + graceMs)) {
          const daysLate = Math.ceil((now - due) / 86400000) - (fs.lateFineRules.gracePeriodDays || 0);
          if (daysLate > 0) {
            const calculatedFine = Math.min(daysLate * fs.lateFineRules.finePerDay, fs.lateFineRules.maxFine || Infinity);
            invoice.fine = calculatedFine;
          }
        }
      }
    }

    const count = await Payment.countDocuments();
    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const payment = await Payment.create({
      invoice: invoiceId,
      student: studentId,
      amountPaid: Number(amount),
      method: paymentMode,
      transactionId,
      receiptNumber,
      recordedBy: req.user._id,
      remarks,
    });

    // Update invoice
    const newPaid = invoice.paidAmount + Number(amount);
    const effectiveTotal = invoice.totalAmount + invoice.fine - invoice.discount;
    invoice.paidAmount = newPaid;
    invoice.status = newPaid >= effectiveTotal ? 'paid' : 'partial';
    await invoice.save();

    const populated = await payment.populate([
      { path: 'student', populate: { path: 'user', select: 'name email' } },
      { path: 'invoice', select: 'invoiceNumber totalAmount description' },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Apply Late Fines (bulk) ─────────────────────────────────────
// POST /api/fees/apply-late-fines
const applyLateFines = async (req, res) => {
  try {
    const overdueInvoices = await Invoice.find({
      status: { $in: ['pending', 'partial'] },
      dueDate: { $lt: new Date() },
    }).populate('feeStructure');

    let updated = 0;
    for (const invoice of overdueInvoices) {
      const fs = invoice.feeStructure;
      if (!fs || !fs.lateFineRules || fs.lateFineRules.finePerDay <= 0) {
        // Mark as overdue even without fine rules
        if (invoice.status !== 'overdue' && invoice.status !== 'partial') {
          invoice.status = 'overdue';
          await invoice.save();
          updated++;
        }
        continue;
      }

      const now = new Date();
      const due = new Date(invoice.dueDate);
      const graceDays = fs.lateFineRules.gracePeriodDays || 0;
      const graceMs = graceDays * 86400000;

      if (now > new Date(due.getTime() + graceMs)) {
        const daysLate = Math.ceil((now - due) / 86400000) - graceDays;
        if (daysLate > 0) {
          const calculatedFine = Math.min(
            daysLate * fs.lateFineRules.finePerDay,
            fs.lateFineRules.maxFine || Infinity
          );
          invoice.fine = calculatedFine;
          if (invoice.paidAmount === 0) invoice.status = 'overdue';
          await invoice.save();
          updated++;
        }
      }
    }

    res.json({ success: true, message: `Late fines applied to ${updated} invoice(s)` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Reports ─────────────────────────────────────────────────────

// GET /api/fees/reports/summary
const getFeeSummary = async (req, res) => {
  try {
    const { from, to, academicYear } = req.query;
    const invoiceFilter = {};
    const paymentFilter = {};

    if (from || to) {
      invoiceFilter.createdAt = {};
      paymentFilter.paymentDate = {};
      if (from) {
        invoiceFilter.createdAt.$gte = new Date(from);
        paymentFilter.paymentDate.$gte = new Date(from);
      }
      if (to) {
        invoiceFilter.createdAt.$lte = new Date(to);
        paymentFilter.paymentDate.$lte = new Date(to);
      }
    }
    if (academicYear) invoiceFilter.academicYear = academicYear;

    // Invoice aggregation
    const invoiceStats = await Invoice.aggregate([
      { $match: invoiceFilter },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalBilled: { $sum: '$totalAmount' },
          totalDiscount: { $sum: '$discount' },
          totalFine: { $sum: '$fine' },
          totalPaid: { $sum: '$paidAmount' },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          partialCount: { $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] } },
          paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          overdueCount: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } },
        },
      },
    ]);

    // Payment method breakdown
    const paymentByMethod = await Payment.aggregate([
      { $match: paymentFilter },
      {
        $group: {
          _id: '$method',
          totalAmount: { $sum: '$amountPaid' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Monthly collection trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const monthlyTrend = await Payment.aggregate([
      { $match: { paymentDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
          totalCollected: { $sum: '$amountPaid' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const stats = invoiceStats[0] || {
      totalInvoices: 0, totalBilled: 0, totalDiscount: 0, totalFine: 0, totalPaid: 0,
      pendingCount: 0, partialCount: 0, paidCount: 0, overdueCount: 0,
    };
    stats.totalOutstanding = stats.totalBilled + stats.totalFine - stats.totalDiscount - stats.totalPaid;

    res.json({
      success: true,
      data: {
        summary: stats,
        paymentByMethod,
        monthlyTrend,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/fees/reports/pending-dues
const getPendingDues = async (req, res) => {
  try {
    const invoices = await Invoice.find({ status: { $in: ['pending', 'partial', 'overdue'] } })
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('feeStructure', 'name')
      .sort({ dueDate: 1 });

    const dues = invoices.map(inv => ({
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      studentName: inv.student?.user?.name || 'Unknown',
      studentEmail: inv.student?.user?.email || '',
      rollNumber: inv.student?.rollNumber || '',
      totalAmount: inv.totalAmount,
      fine: inv.fine,
      discount: inv.discount,
      paidAmount: inv.paidAmount,
      outstanding: inv.totalAmount + inv.fine - inv.discount - inv.paidAmount,
      dueDate: inv.dueDate,
      status: inv.status,
      feeStructure: inv.feeStructure?.name || 'Custom',
    }));

    const totalOutstanding = dues.reduce((s, d) => s + d.outstanding, 0);

    res.json({ success: true, data: { dues, totalOutstanding, count: dues.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/fees/reports/student/:studentId
const getStudentFeeReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).populate('user', 'name email');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const invoices = await Invoice.find({ student: studentId })
      .populate('feeStructure', 'name')
      .sort({ createdAt: -1 });

    const payments = await Payment.find({ student: studentId })
      .populate('invoice', 'invoiceNumber')
      .sort({ paymentDate: -1 });

    const totalBilled = invoices.reduce((s, i) => s + i.totalAmount + i.fine - i.discount, 0);
    const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);

    res.json({
      success: true,
      data: {
        student: { name: student.user?.name, email: student.user?.email, rollNumber: student.rollNumber },
        invoices,
        payments,
        summary: { totalBilled, totalPaid, outstanding: totalBilled - totalPaid },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/fees/reports/monthly-revenue — Aggregates actual payment data by month
const getMonthlyRevenue = async (req, res) => {
  try {
    const { year } = req.query;
    const matchYear = year ? Number(year) : new Date().getFullYear();

    const revenue = await Payment.aggregate([
      {
        $match: {
          paymentDate: {
            $gte: new Date(`${matchYear}-01-01`),
            $lt: new Date(`${matchYear + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          totalRevenue: { $sum: '$amountPaid' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill all 12 months (0 for months with no payments)
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const result = months.map((name, i) => {
      const found = revenue.find(r => r._id === i + 1);
      return {
        month: i + 1,
        monthName: name,
        totalRevenue: found ? found.totalRevenue : 0,
        count: found ? found.count : 0,
      };
    });

    res.json({ success: true, data: result, year: matchYear });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getInvoices, createInvoice, updateInvoice, deleteInvoice,
  getPayments, recordPayment,
  applyLateFines,
  getFeeSummary, getPendingDues, getStudentFeeReport, getMonthlyRevenue,
};
