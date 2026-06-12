const express = require('express');
const router = express.Router();
const {
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getInvoices, createInvoice, updateInvoice, deleteInvoice,
  getPayments, recordPayment,
  applyLateFines,
  getFeeSummary, getPendingDues, getStudentFeeReport, getMonthlyRevenue,
} = require('../controllers/fee.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

// Fee Structures
router.route('/structures')
  .get(authorize('admin', 'staff', 'student'), getFeeStructures)
  .post(authorize('admin'), createFeeStructure);

router.route('/structures/:id')
  .put(authorize('admin'), updateFeeStructure)
  .delete(authorize('admin'), deleteFeeStructure);

// Invoices
router.route('/invoices')
  .get(authorize('admin', 'staff', 'student'), getInvoices)
  .post(authorize('admin'), createInvoice);

router.route('/invoices/:id')
  .put(authorize('admin'), updateInvoice)
  .delete(authorize('admin'), deleteInvoice);

// Payments
router.route('/payments')
  .get(authorize('admin', 'staff', 'student'), getPayments)
  .post(authorize('admin'), recordPayment);

// Late fine bulk apply
router.post('/apply-late-fines', authorize('admin'), applyLateFines);

// Reports
router.get('/reports/summary', authorize('admin', 'staff'), getFeeSummary);
router.get('/reports/pending-dues', authorize('admin', 'staff'), getPendingDues);
router.get('/reports/monthly-revenue', authorize('admin', 'staff'), getMonthlyRevenue);
router.get('/reports/student/:studentId', authorize('admin', 'staff'), getStudentFeeReport);

module.exports = router;
