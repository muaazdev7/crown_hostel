const express = require('express');
const router = express.Router();
const { getLeaves, applyLeave, updateLeave } = require('../controllers/leave.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { authorizeWarden } = require('../middleware/warden.middleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'staff', 'student'), getLeaves)
  .post(authorize('student'), applyLeave);

// Students can cancel their own leave; staff must be Warden to approve/reject
router.route('/:id')
  .put(authorize('admin', 'staff', 'student'), updateLeave);

module.exports = router;
