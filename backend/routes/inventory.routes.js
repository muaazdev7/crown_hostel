const express = require('express');
const router = express.Router();
const {
  getInventory, createInventoryItem, updateInventoryItem, useInventoryItem,
  addStockInventoryItem, deleteInventoryItem,
  updateCondition, markDamaged, updateRepairStatus,
} = require('../controllers/inventory.controller');
const {
  createShortageReport, createDamageReport, getMyReports,
} = require('../controllers/inventoryReport.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const uploadInventory = require('../middleware/uploadInventory.middleware');
const uploadTemp = require('../middleware/multer.middleware'); // Cloudinary temp storage

router.use(protect);

// ── Inventory Reports (staff & admin can create / view own) ──
// Must be declared before the '/:id' routes so they aren't matched as an id.
router.post('/shortage-report', authorize('admin', 'staff'), createShortageReport);
router.post('/damage-report', authorize('admin', 'staff'), uploadTemp.single('image'), createDamageReport);
router.get('/my-reports', authorize('admin', 'staff'), getMyReports);

router.route('/')
  .get(authorize('admin', 'staff'), getInventory)
  .post(authorize('admin'), uploadTemp.single('image'), createInventoryItem);

router.route('/:id')
  .put(authorize('admin'), uploadTemp.single('image'), updateInventoryItem)
  .delete(authorize('admin'), deleteInventoryItem);

router.put('/:id/use', authorize('admin', 'staff'), useInventoryItem);
router.put('/:id/add-stock', authorize('admin'), addStockInventoryItem);

// Condition management — Admin only. Staff report shortages/damage via the
// /shortage-report and /damage-report endpoints instead of editing condition.
router.put('/:id/condition', authorize('admin'), updateCondition);
router.put('/:id/damaged', authorize('admin'), markDamaged);
router.put('/:id/repair-status', authorize('admin'), updateRepairStatus);

module.exports = router;
