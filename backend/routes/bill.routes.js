const express = require('express');
const router = express.Router();
const {
  createBill, getBills, getBillStats, getBill, updateBill, deleteBill,
  getMonthlyReport, getYearlyReport,
} = require('../controllers/bill.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { authorizeWarden } = require('../middleware/warden.middleware');
const uploadBill = require('../middleware/uploadBill.middleware');

router.use(protect);

// Admin-only reports — declared before '/:id' so they aren't matched as an id
router.get('/reports/monthly', authorize('admin'), getMonthlyReport);
router.get('/reports/yearly', authorize('admin'), getYearlyReport);

// Dashboard stats — warden & admin (authorizeWarden lets admins through)
router.get('/stats', authorizeWarden, getBillStats);

// List + create — warden & admin
router.route('/')
  .get(authorizeWarden, getBills)
  .post(authorizeWarden, uploadBill.single('attachment'), createBill);

// View + update — warden & admin; Delete — admin only
router.route('/:id')
  .get(authorizeWarden, getBill)
  .put(authorizeWarden, uploadBill.single('attachment'), updateBill)
  .delete(authorize('admin'), deleteBill);

module.exports = router;
