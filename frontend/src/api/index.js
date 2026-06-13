import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  // NOTE: Do NOT set a default Content-Type here.
  // - For JSON requests, Axios automatically sets application/json.
  // - For FormData requests, the browser must auto-set multipart/form-data
  //   with the correct boundary. A hardcoded header breaks file uploads.
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const verifyEmail = (token) => API.get(`/auth/verify-email/${token}`);

// ── Students ──
export const getStudents = (params) => API.get('/students', { params });
export const getStudent = (id) => API.get(`/students/${id}`);
export const createStudent = (data) => API.post('/students', data);
export const updateStudent = (id, data) => API.put(`/students/${id}`, data);
export const deleteStudent = (id) => API.delete(`/students/${id}`);
export const unassignStudentRoom = (id) => API.post(`/students/${id}/unassign-room`);

// ── Student Self-Service ──
export const getStudentDashboard = () => API.get('/students/dashboard');
export const getMyRoom = () => API.get('/students/my-room');
export const getMyProfile = () => API.get('/students/profile');
export const updateMyProfile = (data) => API.put('/students/profile', data);
export const uploadProfilePhoto = (formData) => API.post('/students/profile/photo', formData);

// ── Staff ──
export const getStaffList = (params) => API.get('/staff', { params });
export const getStaff = (id) => API.get(`/staff/${id}`);
export const createStaff = (data) => API.post('/staff', data);
export const updateStaff = (id, data) => API.put(`/staff/${id}`, data);
export const deleteStaff = (id) => API.delete(`/staff/${id}`);

// ── Staff designation lookups (student maintenance form) ──
export const getStaffDesignations = () => API.get('/staff/designations');
export const getStaffByDesignation = (designation) => API.get(`/staff/by-designation/${encodeURIComponent(designation)}`);

// ── Staff Self-Service ──
export const getStaffDashboard = () => API.get('/staff/dashboard');
export const getStaffProfile = () => API.get('/staff/profile');
export const updateStaffProfile = (data) => API.put('/staff/profile', data);
export const uploadStaffPhoto = (formData) => API.post('/staff/profile/photo', formData);

// ── Maintenance ──
// Admin: all requests. Student: my-requests. Staff: assigned (by designation).
export const getMaintenanceRequests = (params) => API.get('/maintenance', { params });
export const createMaintenanceRequest = (formData) => API.post('/maintenance', formData); // multipart
export const getMyMaintenanceRequests = () => API.get('/maintenance/my-requests');
export const getAssignedMaintenance = (params) => API.get('/maintenance/assigned', { params });
export const updateMaintenanceStatus = (id, data) => API.put(`/maintenance/${id}/status`, data);
export const deleteMaintenanceRequest = (id) => API.delete(`/maintenance/${id}`);

// ── Rooms ──
export const getRooms = (params) => API.get('/rooms', { params });
export const getRoom = (id) => API.get(`/rooms/${id}`);
export const createRoom = (data) => API.post('/rooms', data);
export const updateRoom = (id, data) => API.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => API.delete(`/rooms/${id}`);
export const allocateRoom = (data) => API.post('/rooms/allocate', data);

// ── Blocks ──
export const getBlocks = () => API.get('/rooms/blocks');
export const getBlock = (id) => API.get(`/rooms/blocks/${id}`);
export const createBlock = (data) => API.post('/rooms/blocks', data);
export const updateBlock = (id, data) => API.put(`/rooms/blocks/${id}`, data);
export const deleteBlock = (id) => API.delete(`/rooms/blocks/${id}`);

// ── Fees ──
export const getFeeStructures = (params) => API.get('/fees/structures', { params });
export const createFeeStructure = (data) => API.post('/fees/structures', data);
export const updateFeeStructure = (id, data) => API.put(`/fees/structures/${id}`, data);
export const deleteFeeStructure = (id) => API.delete(`/fees/structures/${id}`);
export const getInvoices = (params) => API.get('/fees/invoices', { params });
export const createInvoice = (data) => API.post('/fees/invoices', data);
export const updateInvoice = (id, data) => API.put(`/fees/invoices/${id}`, data);
export const deleteInvoice = (id) => API.delete(`/fees/invoices/${id}`);
export const recordPayment = (data) => API.post('/fees/payments', data);
export const getPayments = (params) => API.get('/fees/payments', { params });
export const applyLateFines = () => API.post('/fees/apply-late-fines');
export const getFeeSummary = (params) => API.get('/fees/reports/summary', { params });
export const getPendingDues = () => API.get('/fees/reports/pending-dues');
export const getMonthlyRevenue = (params) => API.get('/fees/reports/monthly-revenue', { params });
export const getStudentFeeReport = (studentId) => API.get(`/fees/reports/student/${studentId}`);

// ── Complaints ──
export const getComplaints = (params) => API.get('/complaints', { params });
export const getComplaint = (id) => API.get(`/complaints/${id}`);
export const createComplaint = (data) => API.post('/complaints', data);
export const updateComplaint = (id, data) => API.put(`/complaints/${id}`, data);
export const updateComplaintStatus = (id, data) => API.put(`/complaints/${id}/status`, data);
export const deleteComplaint = (id) => API.delete(`/complaints/${id}`);

// ── Inventory ──
export const getInventory = (params) => API.get('/inventory', { params });
export const createInventoryItem = (data) => API.post('/inventory', data);
export const updateInventoryItem = (id, data) => API.put(`/inventory/${id}`, data);
export const useInventoryItem = (id, data) => API.put(`/inventory/${id}/use`, data);
export const addStockInventoryItem = (id, data) => API.put(`/inventory/${id}/add-stock`, data);
export const deleteInventoryItem = (id) => API.delete(`/inventory/${id}`);
export const updateInventoryCondition = (id, data) => API.put(`/inventory/${id}/condition`, data);
export const markInventoryDamaged = (id, data) => API.put(`/inventory/${id}/damaged`, data);
export const updateRepairStatus = (id, data) => API.put(`/inventory/${id}/repair-status`, data);

// ── Inventory Expense Reports (admin) — grouped by month / year ──
export const getMonthlyInventoryExpense = () => API.get('/admin/inventory/reports/monthly');
export const getYearlyInventoryExpense = () => API.get('/admin/inventory/reports/yearly');
export const deleteMonthlyInventoryReport = (year, month) => API.delete(`/admin/inventory/reports/monthly/${year}/${month}`);
export const deleteYearlyInventoryReport = (year) => API.delete(`/admin/inventory/reports/yearly/${year}`);

// ── Inventory Reports (shortage / damage) ──
export const createShortageReport = (data) => API.post('/inventory/shortage-report', data);
export const createDamageReport = (formData) => API.post('/inventory/damage-report', formData);
export const getMyInventoryReports = (params) => API.get('/inventory/my-reports', { params });
export const getInventoryReports = (params) => API.get('/admin/inventory-reports', { params });
export const respondToShortageReport = (id, data) => API.put(`/admin/inventory-reports/${id}/respond`, data);
export const actionDamageReport = (id, data) => API.put(`/admin/inventory-reports/${id}/action`, data);

// ── Salaries ──
export const paySalary = (data) => API.post('/salaries/pay', data);
export const getSalaryStaffLog = (params) => API.get('/salaries/staff', { params });
export const getSalaryMonthlyReport = (params) => API.get('/salaries/monthly', { params });
export const getSalaryYearlyReport = (params) => API.get('/salaries/yearly', { params });
export const getMySalary = () => API.get('/salaries/my-salary');

// ── Notifications ──
export const getNotifications = (params) => API.get('/notifications', { params });
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');

// ── Visitors (Warden only) ──
export const getVisitors = (params) => API.get('/visitors', { params });
export const createVisitor = (data) => API.post('/visitors', data);
export const updateVisitor = (id, data) => API.put(`/visitors/${id}`, data);
export const deleteVisitor = (id) => API.delete(`/visitors/${id}`);
export const approveVisitor = (id) => API.put(`/visitors/${id}/approve`);
export const rejectVisitor = (id, data) => API.put(`/visitors/${id}/reject`, data);

// ── Bills (hostel operational utility billing — warden & admin) ──
export const getBills = (params) => API.get('/bills', { params });
export const getBill = (id) => API.get(`/bills/${id}`);
export const getBillStats = () => API.get('/bills/stats');
export const createBill = (formData) => API.post('/bills', formData);
export const updateBill = (id, formData) => API.put(`/bills/${id}`, formData);
export const deleteBill = (id) => API.delete(`/bills/${id}`);
export const getBillMonthlyReport = (params) => API.get('/bills/reports/monthly', { params });
export const getBillYearlyReport = (params) => API.get('/bills/reports/yearly', { params });

// ── Visitor Requests (student-submitted → warden approval) ──
export const createVisitorRequest = (data) => API.post('/visitor-requests', data);
export const getMyVisitorRequests = () => API.get('/visitor-requests/my-requests');
export const getPendingVisitorRequests = (params) => API.get('/visitor-requests/pending', { params });
export const approveVisitorRequest = (id, data) => API.put(`/visitor-requests/${id}/approve`, data);
export const rejectVisitorRequest = (id, data) => API.put(`/visitor-requests/${id}/reject`, data);

// ── Attendance ──
export const getAttendance = (params) => API.get('/attendance', { params });
export const markAttendance = (data) => API.post('/attendance', data);
export const updateAttendance = (id, data) => API.put(`/attendance/${id}`, data);

// ── Leave ──
export const getLeaves = (params) => API.get('/leaves', { params });
export const applyLeave = (data) => API.post('/leaves', data);
export const updateLeave = (id, data) => API.put(`/leaves/${id}`, data);

// ── Admin ──
export const getDashboardStats = () => API.get('/admin/dashboard');
export const getAnnouncements = (params) => API.get('/admin/announcements', { params });
export const createAnnouncement = (data) => API.post('/admin/announcements', data);
export const updateAnnouncement = (id, data) => API.put(`/admin/announcements/${id}`, data);
export const deleteAnnouncement = (id) => API.delete(`/admin/announcements/${id}`);
export const getPublicAnnouncements = (params) => API.get('/admin/announcements/public', { params });
export const getApplications = (params) => API.get('/admin/applications', { params });
export const updateApplication = (id, data) => API.put(`/admin/applications/${id}`, data);
export const approveApplication = (id, data) => API.put(`/admin/applications/${id}/approve`, data);
export const rejectApplication = (id, data) => API.put(`/admin/applications/${id}/reject`, data);
export const assignApplicationRoom = (id, data) => API.put(`/admin/applications/${id}/assign-room`, data);
export const deleteApplication = (id) => API.delete(`/admin/applications/${id}`);

// ── Admin: Maintenance Requests ──
export const adminGetMaintenance = (params) => API.get('/admin/maintenance', { params });
export const adminCancelMaintenance = (id) => API.put(`/admin/maintenance/${id}/cancel`);
export const adminDeleteMaintenance = (id) => API.delete(`/admin/maintenance/${id}`);

// ── Admin: Visitor Logs ──
export const adminGetVisitors = (params) => API.get('/admin/visitors', { params });
export const adminDeleteVisitor = (id) => API.delete(`/admin/visitors/${id}`);

// ── Student Applications ──
export const submitApplication = (data) => API.post('/applications', data);
export const getMyApplications = () => API.get('/applications/my');

export default API;
