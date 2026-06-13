const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');

// .trim() defends against trailing spaces / newlines in .env values — a stray
// space in cloud_name or api_key silently breaks Cloudinary auth.
const cloudName  = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey     = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret  = process.env.CLOUDINARY_API_SECRET?.trim();

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// One-time visibility at startup — proves config loaded (never logs the secret).
console.log('[cloudinary] config →', {
  cloud_name: cloudName || 'MISSING ❌',
  api_key: apiKey ? `set(len=${apiKey.length})` : 'MISSING ❌',
  api_secret: apiSecret ? `set(len=${apiSecret.length})` : 'MISSING ❌',
});

/**
 * Upload a local temp file to Cloudinary, then delete the temp file.
 * Throws on failure (after cleanup) so the caller can return a real error
 * instead of a silent success.
 */
const uploadOnCloudinary = async (localFilePath, folder = 'hostel-management') => {
  try {
    if (!localFilePath) {
      console.log('[cloudinary] no localFilePath provided → skipping upload');
      return null;
    }

    // Verify the temp file actually exists before we try to upload it.
    console.log('[cloudinary] uploading:', localFilePath, '| exists:', fs.existsSync(localFilePath));

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
      folder,
    });

    console.log('[cloudinary] ✅ uploaded → public_id:', response.public_id, '| url:', response.secure_url);

    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    return response;
  } catch (err) {
    // Log the FULL error (http_code + message reveals the exact reason, e.g.
    // "Invalid api_key", "Invalid Signature", "cloud_name mismatch").
    console.error('[cloudinary] ❌ upload failed:', { message: err.message, http_code: err.http_code });
    if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    throw err; // surface to the controller — no silent null
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('[cloudinary] delete failed:', err.message);
    return null;
  }
};

module.exports = { cloudinary, uploadOnCloudinary, deleteFromCloudinary };
