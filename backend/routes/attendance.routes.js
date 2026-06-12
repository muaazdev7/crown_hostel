const express = require('express');
const router = express.Router();
const { getAttendance, markAttendance, updateAttendance } = require('../controllers/attendance.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { authorizeWarden } = require('../middleware/warden.middleware');

router.use(protect);

// GET: admin & warden staff can view all; students see only their own (filtered in controller)
router.route('/')
  .get(authorize('admin', 'staff', 'student'), getAttendance)
  .post(authorize('admin', 'staff'), authorizeWarden, markAttendance);

router.route('/:id')
  .put(authorize('admin', 'staff'), authorizeWarden, updateAttendance);

module.exports = router;
