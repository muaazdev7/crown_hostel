const express = require('express');
const router = express.Router();
const { submitApplication, getApplicationById, getMyApplications } = require('../controllers/application.controller');
const { submitApplicationRules } = require('../middleware/validators/application.validator');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// POST /api/applications — Submit a new application (public)
router.post('/', submitApplicationRules, validate, submitApplication);

// GET /api/applications/my — Get logged-in student's applications (must come before /:id)
router.get('/my', protect, authorize('student', 'admin'), getMyApplications);

// GET /api/applications/:id — View a single application (public)
router.get('/:id', getApplicationById);

module.exports = router;
