const express = require('express');
const router = express.Router();
const {
  createVisitorRequest, getMyVisitorRequests, getVisitorRequests,
  approveVisitorRequest, rejectVisitorRequest,
} = require('../controllers/visitorRequest.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { authorizeWarden } = require('../middleware/warden.middleware');

router.use(protect);

// Student — submit + view own requests
router.post('/', authorize('student'), createVisitorRequest);
router.get('/my-requests', authorize('student'), getMyVisitorRequests);

// Warden (admins bypass) — review + approve/reject
router.get('/pending', authorizeWarden, getVisitorRequests);
router.put('/:id/approve', authorizeWarden, approveVisitorRequest);
router.put('/:id/reject', authorizeWarden, rejectVisitorRequest);

module.exports = router;
