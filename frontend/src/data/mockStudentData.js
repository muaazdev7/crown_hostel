// ─────────────────────────────────────────────────────────────────────────────
// Centralized Mock Data — Student Portal
//
// Structure mirrors future API responses so each section can be replaced with
// an Axios/fetch call in useStudentData.js without touching any page component.
// ─────────────────────────────────────────────────────────────────────────────

// ── Image helpers ─────────────────────────────────────────────────────────────
const seed = (id, max = 1000) => (id !== undefined ? id : Math.floor(Math.random() * max));

export const img = {
  profile:   (id) => `https://picsum.photos/200?random=${seed(id)}`,
  room:      (id) => `https://picsum.photos/400/300?random=${seed(id)}`,
  inventory: (id) => `https://picsum.photos/100/100?random=${seed(id)}`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generate attendance for last 30 days (skipping Sundays)
// ─────────────────────────────────────────────────────────────────────────────
const generateAttendance = () => {
  const records = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0) continue; // skip Sundays
    records.push({
      _id: `att-${i}`,
      date: d.toISOString().split('T')[0],
      status: Math.random() > 0.15 ? 'present' : 'absent',
    });
  }
  return records;
};

// ─────────────────────────────────────────────────────────────────────────────
// studentData — the single source of truth for all student-portal pages
// ─────────────────────────────────────────────────────────────────────────────
export const studentData = {

  // ── Profile ────────────────────────────────────────────────────────────────
  profile: {
    _id: 'stu001',
    user: {
      _id:   'u001',
      name:  'Ahmed Bilal',
      email: 'ahmed@hostel.com',
      phone: '9876543210',
    },
    rollNumber:  'CS-2024-042',
    department:  'Computer Science',
    year:        3,
    semester:    5,
    gender:      'male',
    bloodGroup:  'B+',
    status:      'active',
    contactInfo: {
      phone:          '9876543210',
      alternatePhone: '9876500000',
      address: {
        street:  '45 Main Road',
        city:    'Lahore',
        state:   'Punjab',
        pincode: '54000',
      },
    },
    guardianDetails: {
      name:     'Mohammad Bilal',
      phone:    '9876511111',
      email:    'mbilal@email.com',
      relation: 'Father',
    },
    room:  'room001',
    block: 'block001',
    profilePhoto: null,
  },

  // ── Room & Allocation ───────────────────────────────────────────────────────
  room: {
    _id:        'room001',
    roomNumber: 'A-204',
    block: {
      _id:        'block001',
      name:       'Block A',
      type:       'boys',
      facilities: ['WiFi', 'AC', 'Gym'],
    },
    floor:            2,
    type:             'double',
    capacity:         2,
    currentOccupancy: 2,
    occupants: [
      { _id: 'stu001', rollNumber: 'CS-2024-042', user: { name: 'Ahmed Bilal' } },
      { _id: 'stu002', rollNumber: 'CS-2024-078', user: { name: 'Hassan Ali' } },
    ],
    facilities:  ['AC', 'WiFi', 'Attached Bathroom', 'Study Table'],
    monthlyRent: 8500,
    status:      'occupied',
  },

  allocation: {
    _id:       'alloc001',
    student:   'stu001',
    startDate: '2024-08-15',
    endDate:   '2025-06-30',
    status:    'active',
    bedNumber: 'B1',
  },

  // ── Room Inventory ──────────────────────────────────────────────────────────
  roomInventory: [
    { _id: 'inv001', inventory: { _id: 'i1', itemName: 'Study Table',  category: 'furniture'  }, quantity: 1, condition: 'good', status: 'active' },
    { _id: 'inv002', inventory: { _id: 'i2', itemName: 'Ceiling Fan',  category: 'electrical' }, quantity: 1, condition: 'good', status: 'active' },
    { _id: 'inv003', inventory: { _id: 'i3', itemName: 'Wardrobe',     category: 'furniture'  }, quantity: 1, condition: 'good', status: 'active' },
    { _id: 'inv004', inventory: { _id: 'i4', itemName: 'Mattress',     category: 'bedding'    }, quantity: 2, condition: 'good', status: 'active' },
    { _id: 'inv005', inventory: { _id: 'i5', itemName: 'Chair',        category: 'furniture'  }, quantity: 2, condition: 'fair', status: 'active' },
    { _id: 'inv006', inventory: { _id: 'i6', itemName: 'Tube Light',   category: 'electrical' }, quantity: 2, condition: 'good', status: 'active' },
  ],

  // ── Fees ────────────────────────────────────────────────────────────────────
  fees: {
    invoices: [
      {
        _id:           'inv-a',
        invoiceNumber: 'INV-2024-0087',
        totalAmount:   42500,
        discount:      0,
        fine:          0,
        paidAmount:    42500,
        dueDate:       '2024-09-15',
        description:   'Semester 5 Fee - Double Room',
        academicYear:  '2024-25',
        status:        'paid',
      },
      {
        _id:           'inv-b',
        invoiceNumber: 'INV-2025-0012',
        totalAmount:   42500,
        discount:      2500,
        fine:          350,
        paidAmount:    20000,
        dueDate:       '2025-02-15',
        description:   'Semester 6 Fee - Double Room',
        academicYear:  '2024-25',
        status:        'partial',
      },
      {
        _id:           'inv-c',
        invoiceNumber: 'INV-2025-0045',
        totalAmount:   5000,
        discount:      0,
        fine:          0,
        paidAmount:    0,
        dueDate:       '2025-04-30',
        description:   'Security Deposit',
        academicYear:  '2024-25',
        status:        'pending',
      },
    ],

    payments: [
      {
        _id:           'pay001',
        receiptNumber: 'RCP-2024-0234',
        invoice:       { invoiceNumber: 'INV-2024-0087', description: 'Semester 5 Fee' },
        amountPaid:    42500,
        paymentDate:   '2024-09-10T10:15:00Z',
        method:        'online',
        transactionId: 'TXN7483920012',
      },
      {
        _id:           'pay002',
        receiptNumber: 'RCP-2025-0021',
        invoice:       { invoiceNumber: 'INV-2025-0012', description: 'Semester 6 Fee' },
        amountPaid:    20000,
        paymentDate:   '2025-02-05T14:30:00Z',
        method:        'upi',
        transactionId: 'UPI9384756001',
      },
    ],

    structures: [
      {
        _id:             'fs001',
        name:            'Double Room - Semester Fee',
        type:            'semester',
        roomType:        'double',
        baseFee:         42500,
        securityDeposit: 5000,
        components: [
          { name: 'Hostel Rent',       amount: 30000 },
          { name: 'Mess Fee',          amount:  8000 },
          { name: 'Utility Charges',   amount:  4500 },
        ],
        lateFineRules: { finePerDay: 50, gracePeriodDays: 7, maxFine: 2000 },
        academicYear: '2024-25',
        isActive: true,
      },
      {
        _id:             'fs002',
        name:            'Single Room - Semester Fee',
        type:            'semester',
        roomType:        'single',
        baseFee:         55000,
        securityDeposit: 7000,
        components: [
          { name: 'Hostel Rent',       amount: 40000 },
          { name: 'Mess Fee',          amount:  8000 },
          { name: 'Utility Charges',   amount:  7000 },
        ],
        lateFineRules: { finePerDay: 75, gracePeriodDays: 7, maxFine: 3000 },
        academicYear: '2024-25',
        isActive: true,
      },
    ],
  },

  // ── Complaints ──────────────────────────────────────────────────────────────
  complaints: [
    {
      _id:           'cmp001',
      title:         'AC not working properly',
      description:   "The air conditioner in my room makes loud noise and doesn't cool. Issue started 3 days ago.",
      category:      'electrical',
      priority:      'high',
      status:        'in_progress',
      assignedStaff: { name: 'Raza Khan' },
      remarks:       'Technician assigned. Will visit on Monday.',
      createdAt:     '2025-03-20T08:00:00Z',
      resolvedAt:    null,
    },
    {
      _id:           'cmp002',
      title:         'Water leakage in bathroom',
      description:   'Continuous water dripping from the bathroom ceiling near the shower area.',
      category:      'plumbing',
      priority:      'medium',
      status:        'resolved',
      assignedStaff: { name: 'Ali Ahmed' },
      remarks:       'Pipe fixed on 15th March.',
      createdAt:     '2025-03-12T11:30:00Z',
      resolvedAt:    '2025-03-15T16:00:00Z',
    },
    {
      _id:           'cmp003',
      title:         'Room not cleaned since 2 days',
      description:   'Cleaning staff has not visited our room for the past 2 days.',
      category:      'cleanliness',
      priority:      'low',
      status:        'pending',
      assignedStaff: null,
      remarks:       null,
      createdAt:     '2025-03-28T07:00:00Z',
      resolvedAt:    null,
    },
  ],

  // ── Leave Requests ──────────────────────────────────────────────────────────
  leaveRequests: [
    {
      _id:           'lv001',
      leaveType:     'home_visit',
      fromDate:      '2025-04-10',
      toDate:        '2025-04-14',
      reason:        "Family function - sister's wedding",
      destination:   'Karachi',
      contactDuring: '9876543210',
      status:        'approved',
      approvedBy:    { name: 'Warden Khan' },
      approvedAt:    '2025-03-30T09:00:00Z',
      createdAt:     '2025-03-28T10:00:00Z',
    },
    {
      _id:           'lv002',
      leaveType:     'medical',
      fromDate:      '2025-03-05',
      toDate:        '2025-03-07',
      reason:        'High fever and flu symptoms. Doctor advised rest.',
      destination:   'Home - Lahore',
      contactDuring: '9876543210',
      status:        'approved',
      approvedBy:    { name: 'Warden Khan' },
      approvedAt:    '2025-03-05T08:00:00Z',
      createdAt:     '2025-03-04T22:00:00Z',
    },
    {
      _id:           'lv003',
      leaveType:     'personal',
      fromDate:      '2025-04-20',
      toDate:        '2025-04-21',
      reason:        'Driving license appointment at RTA office.',
      destination:   'Lahore',
      contactDuring: '9876543210',
      status:        'pending',
      approvedBy:    null,
      approvedAt:    null,
      createdAt:     '2025-03-29T18:00:00Z',
    },
  ],

  // ── Attendance ──────────────────────────────────────────────────────────────
  attendance: generateAttendance(),

  // ── Applications ────────────────────────────────────────────────────────────
  applications: [
    {
      _id:              'app001',
      registrationNo:   'CS-2024-042',
      applicantName:    'Ahmed Bilal',
      department:       'Computer Science',
      semester:         5,
      preferredRoomType:'double',
      status:           'approved',
      assignedRoom:     { roomNumber: 'A-204' },
      appliedAt:        '2024-07-20T10:30:00Z',
      reviewedAt:       '2024-07-25T14:00:00Z',
    },
    {
      _id:              'app002',
      registrationNo:   'CS-2024-042',
      applicantName:    'Ahmed Bilal',
      department:       'Computer Science',
      semester:         3,
      preferredRoomType:'single',
      status:           'rejected',
      assignedRoom:     null,
      appliedAt:        '2023-07-18T09:00:00Z',
      reviewedAt:       '2023-07-22T11:00:00Z',
    },
  ],

  // ── Notifications ────────────────────────────────────────────────────────────
  notifications: [
    {
      _id:       'n1',
      title:     'Fee Reminder',
      message:   'Semester 6 fee due date is approaching.',
      type:      'fee',
      isRead:    false,
      createdAt: '2025-03-28T08:00:00Z',
    },
    {
      _id:       'n2',
      title:     'Complaint Update',
      message:   'Your AC complaint has been assigned to a technician.',
      type:      'complaint',
      isRead:    false,
      createdAt: '2025-03-25T12:00:00Z',
    },
    {
      _id:       'n3',
      title:     'Leave Approved',
      message:   'Your home visit leave (Apr 10–14) has been approved.',
      type:      'leave',
      isRead:    true,
      createdAt: '2025-03-30T09:00:00Z',
    },
    {
      _id:       'n4',
      title:     'Application Approved',
      message:   'Your room application has been approved. Room A-204 assigned.',
      type:      'application',
      isRead:    true,
      createdAt: '2024-07-25T14:00:00Z',
    },
  ],
};
