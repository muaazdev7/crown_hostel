const Salary = require('../models/Salary.model');
const Staff = require('../models/Staff.model');
const Notification = require('../models/Notification.model');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Build the per-staff salary status list for a given month/year.
// Staff without a record for that period are reported as "pending".
const buildMonthStatusList = async (month, year) => {
  const [staffList, salaries] = await Promise.all([
    Staff.find().populate('user', 'name').lean(),
    Salary.find({ paymentMonth: month, paymentYear: year }).lean(),
  ]);
  const byStaff = new Map(salaries.map((s) => [String(s.staff), s]));

  return staffList.map((st) => {
    const rec = byStaff.get(String(st._id));
    return {
      staffId: st._id,
      staffName: st.user?.name || 'Unknown',
      employeeId: st.employeeId,
      designation: st.designation,
      salaryAmount: rec?.salaryAmount ?? st.salary ?? 0,
      paymentStatus: rec?.paymentStatus || 'pending',
      paymentDate: rec?.paymentDate || null,
      remarks: rec?.remarks || '',
    };
  });
};

// POST /api/salaries/pay  (admin) — confirm salary payment for a staff member
const paySalary = async (req, res) => {
  try {
    const { staffId, paymentMonth, paymentYear, salaryAmount, remarks } = req.body;
    const month = Number(paymentMonth);
    const year = Number(paymentYear);
    if (!staffId || !month || !year || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'staffId, valid paymentMonth and paymentYear are required' });
    }

    const staff = await Staff.findById(staffId).populate('user', 'name');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    const amount = salaryAmount != null && salaryAmount !== '' ? Number(salaryAmount) : (staff.salary || 0);

    const record = await Salary.findOneAndUpdate(
      { staff: staff._id, paymentMonth: month, paymentYear: year },
      {
        staff: staff._id,
        staffName: staff.user?.name,
        employeeId: staff.employeeId,
        designation: staff.designation,
        salaryAmount: amount,
        paymentMonth: month,
        paymentYear: year,
        paymentStatus: 'paid',
        paymentDate: new Date(),
        paidBy: req.user._id,
        remarks,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Notify the staff member
    if (staff.user?._id) {
      await Notification.create({
        recipient: staff.user._id,
        title: 'Salary Paid',
        message: `Your salary for ${MONTH_NAMES[month - 1]} ${year} has been marked as paid.`,
        type: 'salary',
        link: '/staff/salary',
      });
    }

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/salaries/staff  (admin) — salary log for a month (all staff + status)
const getStaffSalaryLog = async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const records = await buildMonthStatusList(month, year);
    res.json({ success: true, data: { month, year, monthName: MONTH_NAMES[month - 1], records } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/salaries/monthly  (admin) — monthly report + total expense
const getMonthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const records = await buildMonthStatusList(month, year);
    const monthlyTotal = records
      .filter((r) => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.salaryAmount || 0), 0);
    res.json({
      success: true,
      data: { month, year, monthName: MONTH_NAMES[month - 1], records, monthlyTotal },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/salaries/yearly  (admin) — month-wise totals + annual total + records
const getYearlyReport = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const paid = await Salary.find({ paymentYear: year, paymentStatus: 'paid' })
      .sort({ paymentMonth: 1 })
      .lean();

    const monthlyTotals = MONTH_NAMES.map((name, i) => ({ month: i + 1, monthName: name, total: 0 }));
    let annualTotal = 0;
    for (const s of paid) {
      monthlyTotals[s.paymentMonth - 1].total += s.salaryAmount || 0;
      annualTotal += s.salaryAmount || 0;
    }

    res.json({ success: true, data: { year, monthlyTotals, annualTotal, records: paid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/salaries/my-salary  (staff) — own payment history
const getMySalary = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff profile not found' });

    const records = await Salary.find({ staff: staff._id })
      .sort({ paymentYear: -1, paymentMonth: -1 })
      .lean();

    const recordsWithLabel = records.map((r) => ({ ...r, monthName: MONTH_NAMES[r.paymentMonth - 1] }));
    res.json({ success: true, data: recordsWithLabel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  paySalary, getStaffSalaryLog, getMonthlyReport, getYearlyReport, getMySalary,
};
