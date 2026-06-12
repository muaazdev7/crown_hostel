const express = require('express');
const router = express.Router();
const {
  createMaintenanceRequest, getMyRequests, getAssignedRequests,
  getMaintenanceRequests, updateStatus, deleteMaintenanceRequest,
} = require('../controllers/maintenance.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const uploadMaintenance = require('../middleware/uploadMaintenance.middleware');

router.use(protect);

// Student — submit + view own requests
router.post('/', authorize('student'), uploadMaintenance.single('image'), createMaintenanceRequest);
router.get('/my-requests', authorize('student'), getMyRequests);

// Staff — view requests routed to their designation
router.get('/assigned', authorize('staff'), getAssignedRequests);

// Admin — view all requests / reports
router.get('/', authorize('admin'), getMaintenanceRequests);

// Staff & Admin — update status / add notes
router.put('/:id/status', authorize('staff', 'admin'), updateStatus);

// Admin — delete
router.delete('/:id', authorize('admin'), deleteMaintenanceRequest);

module.exports = router;
