const express = require('express');
const router = express.Router();
const {
  getRooms, getRoom, createRoom, updateRoom, deleteRoom,
  allocateRoom,
  getBlocks, getBlock, createBlock, updateBlock, deleteBlock,
} = require('../controllers/room.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const uploadBlock = require('../middleware/uploadBlock.middleware');
const uploadRoom = require('../middleware/uploadRoom.middleware');

router.use(protect);

// ── Blocks ──
router.route('/blocks')
  .get(authorize('admin', 'staff'), getBlocks)
  .post(authorize('admin'), uploadBlock.single('image'), createBlock);

router.route('/blocks/:id')
  .get(authorize('admin', 'staff'), getBlock)
  .put(authorize('admin'), uploadBlock.single('image'), updateBlock)
  .delete(authorize('admin'), deleteBlock);

// ── Allocation ──
router.post('/allocate', authorize('admin'), allocateRoom);

// ── Rooms ──
router.route('/')
  .get(authorize('admin', 'staff'), getRooms)
  .post(authorize('admin'), uploadRoom.single('image'), createRoom);

router.route('/:id')
  .get(authorize('admin', 'staff'), getRoom)
  .put(authorize('admin'), uploadRoom.single('image'), updateRoom)
  .delete(authorize('admin'), deleteRoom);

module.exports = router;
