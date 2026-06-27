const express = require('express');
const router = express.Router();
const {
  submitReturnRequest,
  getAllReturnRequests,
  getMyReturnRequests,
  getReturnRequestById,
  linkDamageReport,
  approveReturnRequest,
  rejectReturnRequest
} = require('../controllers/vehicleReturnController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/adminMiddleware');

// ── User routes ──────────────────────────────────────────────────
router.post('/', protect, submitReturnRequest);
router.get('/my', protect, getMyReturnRequests);

// ── Admin routes ─────────────────────────────────────────────────
router.get('/', protect, authorize('admin'), getAllReturnRequests);
router.put('/:id/link-damage', protect, authorize('admin'), linkDamageReport);
router.put('/:id/approve', protect, authorize('admin'), approveReturnRequest);
router.put('/:id/reject', protect, authorize('admin'), rejectReturnRequest);

// ── Shared (admin or owning user) ────────────────────────────────
router.get('/:id', protect, getReturnRequestById);

module.exports = router;