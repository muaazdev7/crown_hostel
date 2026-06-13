const Application = require('../models/Application.model');
const { uploadOnCloudinary } = require('../utils/cloudinary');

// @desc    Submit a new hostel application (public)
// @route   POST /api/applications
// @access  Public
const submitApplication = async (req, res) => {
  try {
    const {
      applicantName, registrationNo, applicantEmail, department, semester,
      gender, contactInfo, guardianDetails, preferredRoomType, preferredBlock,
      medicalInfo, termsAccepted,
    } = req.body;

    // Business rule: only one active (pending/approved) application per registration
    const existing = await Application.findOne({
      registrationNo,
      status: { $in: ['pending', 'approved'] },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An active application with this registration number already exists',
      });
    }

    // Business rule: terms must be accepted
    if (!termsAccepted || termsAccepted === false) {
      return res.status(400).json({
        success: false,
        message: 'Terms must be accepted before submission',
      });
    }

    // Upload any attached documents/images to Cloudinary (abort on failure).
    const documents = [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const result = await uploadOnCloudinary(file.path, 'hostel-management/applications');
        if (!result?.secure_url) {
          return res.status(500).json({ success: false, message: 'Document upload failed' });
        }
        documents.push(result.secure_url);
      }
    }

    const application = await Application.create({
      applicantName,
      registrationNo,
      applicantEmail,
      department,
      semester,
      gender,
      contactInfo,
      guardianDetails,
      preferredRoomType,
      preferredBlock,
      medicalInfo,
      documents,
      termsAccepted,
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single application by ID
// @route   GET /api/applications/:id
// @access  Public
const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('preferredBlock', 'name type')
      .populate('assignedRoom', 'roomNumber type capacity')
      .populate('reviewedBy', 'name');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get applications for the logged-in student
// @route   GET /api/applications/my
// @access  Private (student)
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicantEmail: req.user.email })
      .populate('preferredBlock', 'name type')
      .populate('assignedRoom', 'roomNumber type capacity')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitApplication, getApplicationById, getMyApplications };
