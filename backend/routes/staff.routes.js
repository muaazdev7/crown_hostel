const express = require('express');
const router = express.Router();
const {
  getStaffList, getStaff, createStaff, updateStaff, deleteStaff,
  getStaffDashboard, getStaffProfile, updateStaffProfile, uploadStaffPhoto,
  getDesignations, getStaffByDesignation,
} = require('../controllers/staff.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');
const uploadProfile = require('../middleware/uploadProfile.middleware');

router.use(protect);

// ── Designation lookups (used by the student maintenance form) ──
router.get('/designations', authorize('student', 'staff', 'admin'), getDesignations);
router.get('/by-designation/:designation', authorize('student', 'staff', 'admin'), getStaffByDesignation);

// ── Staff self-service routes (must come before /:id) ──
router.get('/dashboard', authorize('staff'), getStaffDashboard);
router.get('/profile', authorize('staff'), getStaffProfile);
router.put('/profile', authorize('staff'), updateStaffProfile);
router.post('/profile/photo', authorize('staff'), uploadProfile.single('profileImage'), uploadStaffPhoto);

// ── Admin management routes ──
router.route('/')
  .get(authorize('admin'), getStaffList)
  .post(authorize('admin'), upload.single('profileImage'), createStaff);

router.route('/:id')
  .get(authorize('admin'), getStaff)
  .put(authorize('admin'), upload.single('profileImage'), updateStaff)
  .delete(authorize('admin'), deleteStaff);

module.exports = router;
