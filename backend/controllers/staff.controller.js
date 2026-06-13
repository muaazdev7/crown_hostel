const Staff = require('../models/Staff.model');
const User = require('../models/User.model');
const Complaint = require('../models/Complaint.model');
const Inventory = require('../models/Inventory.model');
const MaintenanceRequest = require('../models/MaintenanceRequest.model');
const Student = require('../models/Student.model');
const Announcement = require('../models/Announcement.model');
const Leave = require('../models/Leave.model');
const Visitor = require('../models/Visitor.model');
const InventoryReport = require('../models/InventoryReport.model');
const Notification = require('../models/Notification.model');
const { uploadOnCloudinary } = require('../utils/cloudinary');

// Helper: parse fields that arrive as JSON strings from FormData
const parseJsonField = (value) => {
  if (!value) return undefined;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return value; }
};

// GET /api/staff
const getStaffList = async (req, res) => {
  try {
    const { page = 1, limit = 20, department, shift } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (shift) filter.shift = shift;

    const total = await Staff.countDocuments(filter);
    const staff = await Staff.find(filter)
      .populate('user', 'name email phone status')
      .populate('assignedBlock', 'name type')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, data: staff, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/staff/:id
const getStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('user', '-password')
      .populate('assignedBlock');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/staff
const createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, employeeId, designation, department,
      gender, dateOfBirth, shift, assignedBlock, salary } = req.body;

    const address = parseJsonField(req.body.address);

    if (!name || !email || !password || !employeeId || !designation) {
      return res.status(400).json({ success: false, message: 'name, email, password, employeeId and designation are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already in use' });

    const existingEmp = await Staff.findOne({ employeeId });
    if (existingEmp) return res.status(400).json({ success: false, message: 'Employee ID already exists' });

    // Upload image to Cloudinary BEFORE creating records (abort cleanly on fail).
    let profileImage;
    if (req.file) {
      const result = await uploadOnCloudinary(req.file.path, 'hostel-management/profiles');
      if (!result?.secure_url) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      profileImage = result.secure_url;
    }

    const user = await User.create({ name, email, password, role: 'staff', phone });
    const staff = await Staff.create({
      user: user._id, employeeId, designation, department, gender,
      dateOfBirth, address, shift, assignedBlock, salary,
      ...(profileImage ? { profileImage } : {}),
    });

    await User.findByIdAndUpdate(user._id, { profileRef: staff._id, profileModel: 'Staff' });

    const populated = await Staff.findById(staff._id)
      .populate('user', 'name email phone status')
      .populate('assignedBlock', 'name type');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/staff/:id — Update both Staff fields and linked User fields
const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    // Separate User-level fields from Staff-level fields
    const { name, email, phone, password, address, ...staffFields } = req.body;

    // Parse nested objects that come as strings when sent via FormData
    if (address) staffFields.address = parseJsonField(address);

    // Handle profile image upload → Cloudinary (abort on failure)
    if (req.file) {
      const result = await uploadOnCloudinary(req.file.path, 'hostel-management/profiles');
      if (!result?.secure_url) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      staffFields.profileImage = result.secure_url;
    }

    // If employeeId is being changed, check uniqueness
    if (staffFields.employeeId && staffFields.employeeId !== staff.employeeId) {
      const existingEmp = await Staff.findOne({ employeeId: staffFields.employeeId });
      if (existingEmp) {
        return res.status(400).json({ success: false, message: 'Employee ID already exists' });
      }
    }

    // Update User model fields (name, email, phone) if provided
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (email) userUpdates.email = email;
    if (phone !== undefined) userUpdates.phone = phone;

    if (Object.keys(userUpdates).length > 0) {
      if (email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: staff.user } });
        if (existingEmail) {
          return res.status(400).json({ success: false, message: 'Email already in use by another account' });
        }
      }
      await User.findByIdAndUpdate(staff.user, userUpdates, { runValidators: true });
    }

    // Update password separately (triggers pre-save hash)
    if (password) {
      const user = await User.findById(staff.user).select('+password');
      user.password = password;
      await user.save();
    }

    // Update Staff model fields
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id, staffFields, { new: true, runValidators: true }
    ).populate('user', 'name email phone status')
     .populate('assignedBlock', 'name type');

    res.json({ success: true, data: updatedStaff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/staff/:id — Permanently delete staff and associated user
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    await User.findByIdAndDelete(staff.user);
    await Staff.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Staff permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Staff Self-Service Endpoints ─────────────────────────────────────────

// GET /api/staff/dashboard — Staff dashboard stats & activity from real data
const getStaffDashboard = async (req, res) => {
  try {
    // Resolve the staff profile up front so we can branch on designation
    const staff = await Staff.findOne({ user: req.user._id }).populate('assignedBlock', 'name');
    const isWarden = staff?.designation === 'Warden';

    const now = new Date();
    const announcementFilter = {
      targetRole: { $in: ['staff', 'all'] },
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }],
    };

    // Maintenance assigned specifically to this staff member (open work only)
    const myMaintenanceFilter = {
      assignedStaff: staff?._id,
      status: { $in: ['pending', 'assigned', 'in_progress'] },
    };

    const [
      openComplaints,
      totalComplaints,
      resolvedComplaints,
      inProgressComplaints,
      pendingMaintenance,
      inventoryAlerts,
      totalStudents,
      pendingLeaves,
      pendingVisitors,
      announcementsCount,
      recentComplaints,
      announcements,
      recentInventoryReports,
      recentLeaves,
      recentNotifications,
      recentMaintenance,
    ] = await Promise.all([
      Complaint.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'in_progress' }),
      MaintenanceRequest.countDocuments(myMaintenanceFilter),
      Inventory.countDocuments({
        isActive: true,
        $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] },
      }),
      Student.countDocuments(),
      Leave.countDocuments({ status: 'pending' }),
      // Visitor data is warden-only; non-wardens always see 0
      isWarden ? Visitor.countDocuments({ status: 'pending' }) : Promise.resolve(0),
      Announcement.countDocuments(announcementFilter),
      Complaint.find({ status: { $in: ['pending', 'in_progress'] } })
        .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
        .populate('room', 'roomNumber')
        .sort({ createdAt: -1 })
        .limit(5),
      Announcement.find(announcementFilter)
        .populate('createdBy', 'name')
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(5),
      InventoryReport.find()
        .populate('item', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Leave.find({ status: 'pending' })
        .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      MaintenanceRequest.find(myMaintenanceFilter)
        .sort({ priority: -1, createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          openComplaints,
          totalComplaints,
          resolvedComplaints,
          inProgressComplaints,
          pendingComplaints: totalComplaints - resolvedComplaints - inProgressComplaints,
          pendingMaintenance,
          inventoryAlerts,
          totalStudents,
          leaveRequests: pendingLeaves,
          visitorRequests: pendingVisitors,
          announcements: announcementsCount,
        },
        recentComplaints,
        announcements,
        recentInventoryReports,
        recentLeaves,
        recentNotifications,
        recentMaintenance,
        staff: {
          name: req.user.name,
          designation: staff?.designation || 'Staff',
          profileImage: staff?.profileImage || null,
          assignedBlock: staff?.assignedBlock?.name || null,
          isWarden,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/staff/profile — View own profile
const getStaffProfile = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id })
      .populate('user', '-password')
      .populate('assignedBlock', 'name type');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff profile not found' });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/staff/profile — Update own profile (whitelisted fields only)
const updateStaffProfile = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff profile not found' });

    // ── Whitelist: only personal & contact fields ──
    const { fullName, gender, dateOfBirth, cnic, address, email, phone, emergencyContact } = req.body;

    // Validate email format
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email' });
    }

    // Validate phone format
    if (phone && !/^\d{10,15}$/.test(phone.replace(/[-()\s]/g, ''))) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number' });
    }

    // Validate name
    if (fullName !== undefined && !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    // ── Update User-level fields (name, email, phone) ──
    const userUpdates = {};
    if (fullName) userUpdates.name = fullName.trim();
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: staff.user } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already in use by another account' });
      }
      userUpdates.email = email.toLowerCase().trim();
    }
    if (phone !== undefined) userUpdates.phone = phone;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(staff.user, userUpdates, { runValidators: true });
    }

    // ── Update Staff-level fields (only whitelisted) ──
    const staffUpdates = {};
    if (gender !== undefined) staffUpdates.gender = gender;
    if (dateOfBirth !== undefined) staffUpdates.dateOfBirth = dateOfBirth;
    if (cnic !== undefined) staffUpdates.cnic = cnic;
    if (address !== undefined) staffUpdates.address = address;
    if (emergencyContact !== undefined) staffUpdates.emergencyContact = emergencyContact;

    const updatedStaff = await Staff.findByIdAndUpdate(staff._id, staffUpdates, {
      new: true,
      runValidators: true,
    })
      .populate('user', '-password')
      .populate('assignedBlock', 'name type');

    res.json({ success: true, message: 'Profile updated successfully', data: updatedStaff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/staff/profile/photo — Upload/replace profile photo
const uploadStaffPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff profile not found' });

    // Upload temp file → Cloudinary (util deletes the temp file in all cases).
    const result = await uploadOnCloudinary(req.file.path, 'hostel-management/profiles');
    if (!result?.secure_url) {
      return res.status(500).json({ success: false, message: 'Image upload failed' });
    }

    staff.profileImage = result.secure_url; // store the Cloudinary URL
    await staff.save();

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: { profileImage: staff.profileImage },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Canonical staff designations the organization supports (kept in sync with the
// admin "Add Staff" form). Returned alongside DB values so the student
// maintenance form always shows the full set, not only designations that
// currently happen to have a staff member.
const STAFF_DESIGNATIONS = [
  'Warden', 'Security Guard', 'Housekeeping', 'Maintenance',
  'Cook', 'Receptionist', 'Other',
];

// GET /api/staff/designations — full designation list (canonical ∪ in-use)
const getDesignations = async (req, res) => {
  try {
    const inUse = await Staff.distinct('designation');
    const all = [...new Set([...STAFF_DESIGNATIONS, ...inUse.filter(Boolean)])].sort();
    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/staff/by-designation/:designation — staff members of one designation
const getStaffByDesignation = async (req, res) => {
  try {
    const staff = await Staff.find({ designation: req.params.designation })
      .populate('user', 'name')
      .select('user designation employeeId')
      .sort({ employeeId: 1 });

    const data = staff.map((s) => ({
      _id: s._id,
      name: s.user?.name || 'Unknown',
      designation: s.designation,
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStaffList, getStaff, createStaff, updateStaff, deleteStaff,
  getStaffDashboard, getStaffProfile, updateStaffProfile, uploadStaffPhoto,
  getDesignations, getStaffByDesignation,
};
