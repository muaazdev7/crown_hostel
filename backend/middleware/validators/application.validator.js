const { body, param, query } = require('express-validator');

// Validation rules for POST /api/applications (public submission)
const submitApplicationRules = [
  body('applicantName')
    .trim()
    .notEmpty()
    .withMessage('Applicant name is required'),
  body('registrationNo')
    .trim()
    .notEmpty()
    .withMessage('Registration number is required'),
  body('applicantEmail')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('contactInfo.phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('guardianDetails.name')
    .trim()
    .notEmpty()
    .withMessage('Guardian name is required'),
  body('guardianDetails.phone')
    .trim()
    .notEmpty()
    .withMessage('Guardian phone is required'),
  body('preferredRoomType')
    .optional()
    .isIn(['single', 'double', 'triple'])
    .withMessage('Room type must be single, double, or triple'),
  body('termsAccepted')
    .notEmpty()
    .withMessage('Terms acceptance is required')
    .isBoolean()
    .withMessage('termsAccepted must be a boolean')
    .custom((value) => {
      if (value !== true && value !== 'true') {
        throw new Error('Terms must be accepted before submission');
      }
      return true;
    }),
];

// Validation for PUT /api/admin/applications/:id/assign-room
const assignRoomRules = [
  param('id').isMongoId().withMessage('Invalid application ID'),
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .isMongoId()
    .withMessage('Invalid room ID'),
];

// Validation for admin filtering
const getApplicationsRules = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Invalid status filter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  submitApplicationRules,
  assignRoomRules,
  getApplicationsRules,
};
