const express = require('express');
const router = express.Router();
const {
  paySalary, getStaffSalaryLog, getMonthlyReport, getYearlyReport, getMySalary,
} = require('../controllers/salary.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

// Staff — own salary history
router.get('/my-salary', authorize('staff'), getMySalary);

// Admin — salary management + reports
router.post('/pay', authorize('admin'), paySalary);
router.get('/staff', authorize('admin'), getStaffSalaryLog);
router.get('/monthly', authorize('admin'), getMonthlyReport);
router.get('/yearly', authorize('admin'), getYearlyReport);

module.exports = router;
