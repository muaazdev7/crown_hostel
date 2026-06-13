const { uploadOnCloudinary } = require('../utils/cloudinary');

// POST /api/uploads/profile-picture   (multipart/form-data, field: "image")
const uploadProfilePicture = async (req, res) => {
  try {
    // Proves Multer intercepted the file and saved it to public/temp.
    console.log('Req.file:', req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file received. Send multipart/form-data with field name "image".',
      });
    }

    const result = await uploadOnCloudinary(req.file.path, 'hostel-management/profiles');

    // Defensive: if somehow null (no path), fail loudly rather than fake success.
    if (!result || !result.secure_url) {
      return res.status(500).json({ success: false, message: 'Cloudinary returned no result.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    // uploadOnCloudinary re-throws the real Cloudinary error — surface it.
    console.error('[uploadProfilePicture] ❌', err);
    return res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: err.message,          // e.g. "Invalid api_key abc"
      cloudinaryCode: err.http_code, // e.g. 401
    });
  }
};

module.exports = { uploadProfilePicture };
