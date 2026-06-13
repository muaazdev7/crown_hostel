const express = require('express');
const router = express.Router();
const { uploadProfilePicture } = require('../controllers/upload.controller');
const upload = require('../middleware/multer.middleware');
const { protect } = require('../middleware/auth.middleware');

// Authenticated image upload → Cloudinary. Field name: "image".
router.post('/profile-picture', protect, upload.single('image'), uploadProfilePicture);

module.exports = router;
