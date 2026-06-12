const express = require('express');
const router = express.Router();
const { getComplaints, getComplaint, createComplaint, updateComplaint, updateComplaintStatus, deleteComplaint } = require('../controllers/complaint.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'staff', 'student'), getComplaints)
  .post(authorize('student'), createComplaint);

router.route('/:id/status')
  .put(authorize('admin', 'staff'), updateComplaintStatus);

router.route('/:id')
  .get(authorize('admin', 'staff', 'student'), getComplaint)
  .put(authorize('admin', 'staff'), updateComplaint)
  .delete(authorize('admin'), deleteComplaint);

module.exports = router;
