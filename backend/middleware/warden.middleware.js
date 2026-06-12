const Staff = require('../models/Staff.model');

/**
 * Middleware: authorizeWarden
 *
 * Ensures the authenticated user is a staff member with designation "Warden".
 * Must be used AFTER the `protect` middleware (so req.user is set).
 *
 * Admin users are always allowed through (they outrank wardens).
 */
const authorizeWarden = async (req, res, next) => {
  try {
    // Admins bypass this check
    if (req.user.role === 'admin') return next();

    if (req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Warden privileges required.',
      });
    }

    // Look up the Staff profile to verify designation
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff || staff.designation !== 'Warden') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Warden privileges required.',
      });
    }

    // Attach designation to req.user for downstream use
    req.user.designation = staff.designation;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { authorizeWarden };
