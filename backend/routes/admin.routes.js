const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, getPublicAnnouncements,
  getApplications, updateApplication, approveApplication, rejectApplication,
  assignRoom, deleteApplication, getApplicationHistory, getUsers, toggleUserStatus,
} = require('../controllers/admin.controller');
const {
  getAllReports, respondToShortageReport, actionDamageReport,
} = require('../controllers/inventoryReport.controller');
const {
  getMaintenanceRequests, cancelMaintenanceRequest, deleteMaintenanceRequest,
} = require('../controllers/maintenance.controller');
const {
  getVisitorRequests, deleteVisitorRequest,
} = require('../controllers/visitorRequest.controller');
const {
  getMonthlyExpenseReport, getYearlyExpenseReport,
  deleteMonthlyReport, deleteYearlyReport,
} = require('../controllers/inventory.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { assignRoomRules, getApplicationsRules } = require('../middleware/validators/application.validator');

router.use(protect);

// Dashboard
router.get('/dashboard', authorize('admin'), getDashboardStats);

// Announcements — public must come before /:id
router.get('/announcements/public', authorize('admin', 'staff', 'student'), getPublicAnnouncements);
router.route('/announcements')
  .get(authorize('admin'), getAnnouncements)
  .post(authorize('admin'), createAnnouncement);
router.route('/announcements/:id')
  .put(authorize('admin'), updateAnnouncement)
  .delete(authorize('admin'), deleteAnnouncement);

// Applications — history must come before :id to avoid being matched as an ID
router.get('/applications/history', authorize('admin'), getApplicationsRules, validate, getApplicationHistory);

router.route('/applications')
  .get(authorize('admin'), getApplicationsRules, validate, getApplications);

router.put('/applications/:id', authorize('admin'), updateApplication);
router.put('/applications/:id/approve', authorize('admin'), approveApplication);
router.put('/applications/:id/reject', authorize('admin'), rejectApplication);
router.put('/applications/:id/assign-room', authorize('admin'), assignRoomRules, validate, assignRoom);
router.delete('/applications/:id', authorize('admin'), deleteApplication);

// Users
router.get('/users', authorize('admin'), getUsers);
router.put('/users/:id/toggle', authorize('admin'), toggleUserStatus);

// Inventory Reports (shortage + damage management)
router.get('/inventory-reports', authorize('admin'), getAllReports);
router.put('/inventory-reports/:id/respond', authorize('admin'), respondToShortageReport);
router.put('/inventory-reports/:id/action', authorize('admin'), actionDamageReport);

// Maintenance requests — admin view / cancel / delete
router.get('/maintenance', authorize('admin'), getMaintenanceRequests);
router.put('/maintenance/:id/cancel', authorize('admin'), cancelMaintenanceRequest);
router.delete('/maintenance/:id', authorize('admin'), deleteMaintenanceRequest);

// Visitor logs — admin view / delete
router.get('/visitors', authorize('admin'), getVisitorRequests);
router.delete('/visitors/:id', authorize('admin'), deleteVisitorRequest);

// Inventory expense reports (monthly + yearly, grouped via aggregation)
router.get('/inventory/reports/monthly', authorize('admin'), getMonthlyExpenseReport);
router.get('/inventory/reports/yearly', authorize('admin'), getYearlyExpenseReport);
router.delete('/inventory/reports/monthly/:year/:month', authorize('admin'), deleteMonthlyReport);
router.delete('/inventory/reports/yearly/:year', authorize('admin'), deleteYearlyReport);

module.exports = router;
