const express = require('express');
const router = express.Router();
const { submitApplication, getApplicationById, getMyApplications } = require('../controllers/application.controller');
const { submitApplicationRules } = require('../middleware/validators/application.validator');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const uploadTemp = require('../middleware/multer.middleware'); // Cloudinary temp storage

// Nested objects are sent as JSON strings in multipart/form-data — parse them
// back into objects BEFORE the express-validator rules run (which read e.g.
// contactInfo.phone), and coerce the FormData string scalars.
const parseJsonFields = (req, _res, next) => {
  for (const k of ['contactInfo', 'guardianDetails', 'medicalInfo']) {
    if (typeof req.body[k] === 'string') {
      try { req.body[k] = JSON.parse(req.body[k]); } catch { /* leave as-is */ }
    }
  }
  if (typeof req.body.termsAccepted === 'string') req.body.termsAccepted = req.body.termsAccepted === 'true';
  if (typeof req.body.semester === 'string' && req.body.semester !== '') req.body.semester = Number(req.body.semester);
  next();
};

// POST /api/applications — Submit a new application (public). Up to 5 documents.
router.post('/', uploadTemp.array('documents', 5), parseJsonFields, submitApplicationRules, validate, submitApplication);

// GET /api/applications/my — Get logged-in student's applications (must come before /:id)
router.get('/my', protect, authorize('student', 'admin'), getMyApplications);

// GET /api/applications/:id — View a single application (public)
router.get('/:id', getApplicationById);

module.exports = router;
