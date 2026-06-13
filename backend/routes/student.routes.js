const express = require('express');
const router = express.Router();
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent, unassignRoom, getProfile, updateProfile, uploadProfilePhoto, getDashboard, getMyRoom } = require('../controllers/student.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');
const uploadProfile = require('../middleware/uploadProfile.middleware');
const uploadTemp = require('../middleware/multer.middleware'); // Cloudinary temp storage

router.use(protect);

// ── Student self-service routes (must be before /:id routes) ────────────
router.get('/dashboard', authorize('student'), getDashboard);
router.get('/my-room', authorize('student'), getMyRoom);
router.get('/profile', authorize('student'), getProfile);
router.put('/profile', authorize('student'), updateProfile);
router.post('/profile/photo', authorize('student'), uploadTemp.single('profileImage'), uploadProfilePhoto);

// ── Admin/Staff management routes ───────────────────────────────────────
router.route('/')
  .get(authorize('admin', 'staff'), getStudents)
  .post(authorize('admin'), uploadTemp.single('profileImage'), createStudent);

router.post('/:id/unassign-room', authorize('admin'), unassignRoom);

router.route('/:id')
  .get(authorize('admin', 'staff'), getStudent)
  .put(authorize('admin'), uploadTemp.single('profileImage'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

module.exports = router;
