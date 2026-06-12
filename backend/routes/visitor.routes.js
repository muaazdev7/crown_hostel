const express = require('express');
const router = express.Router();
const {
  getVisitors, createVisitor, updateVisitor, deleteVisitor, approveVisitor, rejectVisitor,
} = require('../controllers/visitor.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeWarden } = require('../middleware/warden.middleware');

// Every visitor route requires authentication AND Warden privileges.
// (Admins bypass the warden check inside authorizeWarden.)
router.use(protect);
router.use(authorizeWarden);

router.route('/')
  .get(getVisitors)
  .post(createVisitor);

router.route('/:id')
  .put(updateVisitor)
  .delete(deleteVisitor);

router.put('/:id/approve', approveVisitor);
router.put('/:id/reject', rejectVisitor);

module.exports = router;
