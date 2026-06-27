const express = require('express');
const router = express.Router();
const {
  getWallet,
  payFineFromWallet,
  withdrawFromWallet
} = require('../controllers/vehicleReturnController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWallet);
router.post('/pay-fine', protect, payFineFromWallet);
router.post('/withdraw', protect, withdrawFromWallet);

module.exports = router;