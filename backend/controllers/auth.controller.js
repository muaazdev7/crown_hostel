const crypto = require('crypto');
const User = require('../models/User.model');
const Admin = require('../models/Admin.model');
const Staff = require('../models/Staff.model');
const Student = require('../models/Student.model');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// Auto-create the role profile (Admin/Staff/Student) and link it to the User
const createRoleProfile = async (user, extraData = {}) => {
  let profile;
  const modelName = user.role.charAt(0).toUpperCase() + user.role.slice(1); // 'Admin' | 'Staff' | 'Student'

  if (user.role === 'admin') {
    profile = await Admin.create({
      user: user._id,
      employeeId: extraData.employeeId || `ADM-${Date.now()}`,
      designation: extraData.designation || 'Hostel Administrator',
    });
  } else if (user.role === 'staff') {
    profile = await Staff.create({
      user: user._id,
      employeeId: extraData.employeeId || `STF-${Date.now()}`,
      designation: extraData.designation || 'Staff',
    });
  } else if (user.role === 'student') {
    profile = await Student.create({
      user: user._id,
      rollNumber: extraData.rollNumber || `STU-${Date.now()}`,
      department: extraData.department || 'Unassigned',
      semester: extraData.semester || 1,
      gender: extraData.gender,
    });
  }

  // Link profile back to User
  if (profile) {
    await User.findByIdAndUpdate(user._id, {
      profileRef: profile._id,
      profileModel: modelName,
    });
  }

  return profile;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, ...extraData } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password and role' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Students must verify their email before logging in. Admin/staff are
    // created active (they're typically provisioned internally).
    const isStudent = role === 'student';
    const verificationToken = isStudent ? crypto.randomBytes(32).toString('hex') : undefined;
    const verificationTokenExpiresAt = isStudent ? Date.now() + 24 * 60 * 60 * 1000 : undefined; // 24h

    // password is hashed by the User pre-save hook — left intact.
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      phone,
      isVerified: !isStudent,
      verificationToken,
      verificationTokenExpiresAt,
    });

    // Auto-create the matching profile (Admin / Staff / Student)
    let profile;
    try {
      profile = await createRoleProfile(user, extraData);
    } catch (profileError) {
      // Rollback: delete the orphaned User if profile creation fails
      await User.findByIdAndDelete(user._id);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    // ── Student flow: send verification email, do NOT issue a session ──
    if (isStudent) {
      const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
      const verifyURL = `${clientURL}/verify-email/${verificationToken}`;

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#1e293b;margin-bottom:8px;">Verify your email</h2>
          <p style="color:#64748b;font-size:14px;margin-bottom:24px;">
            Welcome to Crown Hostel, ${user.name}! Please confirm your email address to activate your account.
          </p>
          <a href="${verifyURL}"
             style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;
                    text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
            Verify Email
          </a>
          <p style="margin-top:24px;color:#94a3b8;font-size:12px;">
            If you didn't create this account, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
          <p style="color:#cbd5e1;font-size:11px;">Crown Hostel Management System</p>
        </div>
      `;

      try {
        await sendEmail({
          to: user.email,
          subject: 'Crown Hostel — Verify your email',
          html,
          // In dev the util logs this URL to the console so the flow is testable.
          devResetUrl: process.env.EMAIL_HOST ? undefined : verifyURL,
        });
      } catch (emailError) {
        // Roll back so the user can re-register instead of being stuck unverifiable
        await Student.deleteOne({ user: user._id });
        await User.findByIdAndDelete(user._id);
        // Log the FULL SMTP error so the real cause (e.g. "535 Username and
        // Password not accepted") is visible in the server console.
        console.error('[register] verification email failed:', emailError);
        const isProd = process.env.NODE_ENV === 'production';
        return res.status(500).json({
          success: false,
          message: 'Could not send the verification email. Please try again.',
          // Surface the real reason while developing (hidden in production).
          ...(isProd ? {} : { detail: emailError.message }),
        });
      }

      return res.status(201).json({
        success: true,
        requiresVerification: true,
        message: 'Registration successful! Please check your email to verify your account before logging in.',
      });
    }

    // ── Admin / Staff flow: unchanged — issue a session immediately ──
    const designation = user.role === 'staff' && profile ? profile.designation : null;
    const token = generateToken(user._id, user.role, designation);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        ...(designation && { designation }),
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password +verificationToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Block students who registered via email but haven't verified yet.
    // The `verificationToken` guard means pre-existing / internally-created
    // student accounts (no pending token) are never locked out.
    if (user.role === 'student' && user.isVerified === false && user.verificationToken) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Look up designation for staff users
    let designation = null;
    if (user.role === 'staff') {
      const staffProfile = await Staff.findOne({ user: user._id });
      if (staffProfile) designation = staffProfile.designation;
    }

    const token = generateToken(user._id, user.role, designation);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        ...(designation && { designation }),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user (client should discard token)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (_req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get currently logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const userData = user.toObject();

    // Attach designation for staff users
    if (user.role === 'staff') {
      const staffProfile = await Staff.findOne({ user: user._id });
      if (staffProfile) userData.designation = staffProfile.designation;
    }

    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send password-reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    /*
     * Security: always respond with 200 so attackers cannot enumerate
     * registered emails.  The same message is shown whether or not the
     * address exists in the database.
     */
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email is registered, a reset link has been sent.',
      });
    }

    /* ── Generate a secure random token ── */
    const rawToken   = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpire  = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    /* ── Build reset URL ── */
    const clientURL  = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetURL   = `${clientURL}/reset-password/${rawToken}`;

    /* ── Email HTML ── */
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1e293b;margin-bottom:8px;">Reset your password</h2>
        <p style="color:#64748b;font-size:14px;margin-bottom:24px;">
          We received a request to reset the password for your Crown Hostel account.
          Click the button below within <strong>30 minutes</strong> to set a new password.
        </p>
        <a href="${resetURL}"
           style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;
                  text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
          Reset Password
        </a>
        <p style="margin-top:24px;color:#94a3b8;font-size:12px;">
          If you didn't request this, you can safely ignore this email.<br/>
          This link will expire in 30 minutes.
        </p>
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
        <p style="color:#cbd5e1;font-size:11px;">Crown Hostel Management System</p>
      </div>
    `;

    try {
      await sendEmail({
        to:          user.email,
        subject:     'Crown Hostel — Password Reset Link',
        html,
        // In development, sendEmail logs this URL to the console so the flow
        // can be tested without a real inbox.
        devResetUrl: process.env.EMAIL_HOST ? undefined : resetURL,
      });
      return res.status(200).json({
        success: true,
        message: 'If that email is registered, a reset link has been sent.',
      });
    } catch (emailError) {
      /* Roll back token only when using real SMTP and delivery actually failed */
      user.resetPasswordToken  = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('[forgotPassword] email error:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Check your SMTP configuration and try again.',
      });
    }
  } catch (error) {
    console.error('[forgotPassword]', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both password fields.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    /* Hash the raw URL token to compare against DB */
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    user.password            = password; // pre-save hook hashes it
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('[resetPassword]', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};

// @desc    Verify a student's email using the token from the link
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token })
      .select('+verificationTokenExpiresAt');

    if (!user) {
      // Token genuinely doesn't exist (wrong/garbage link).
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired.',
      });
    }

    // ── Idempotent: a duplicate request (React StrictMode double-fire, a
    //    double-click, or a retry) for an already-verified user returns 200,
    //    NOT an error. The token is intentionally NOT deleted so concurrent
    //    requests still resolve the same user. ──
    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully. You can now log in.',
      });
    }

    // First-time verification — enforce token expiry.
    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired. Please register again.',
      });
    }

    user.isVerified = true; // token kept so duplicate requests stay idempotent
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('[verifyEmail]', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};

module.exports = { register, login, logout, getMe, forgotPassword, resetPassword, verifyEmail };
