const VehicleReturn = require('../models/VehicleReturn');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const DamageReport = require('../models/DamageReport');

const FINE_RATE_PER_DAY = 1.5; // 150% of the car's daily rate, per day late

const msPerDay = 1000 * 60 * 60 * 24;

/**
 * Credit/debit a user's wallet and log a transaction record.
 * Returns the new balance.
 */
async function applyWalletTransaction({ userId, type, amount, description, vehicleReturnId = null, bookingId = null }) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found for wallet transaction');

  const isCredit = ['deposit_refund', 'adjustment'].includes(type) ? amount >= 0 : false;
  const isDebit = ['fine_deduction', 'fine_payment', 'withdrawal'].includes(type);

  let signedAmount;
  if (type === 'adjustment') {
    signedAmount = amount; // amount itself carries the sign for manual admin adjustments
  } else if (isDebit) {
    signedAmount = -Math.abs(amount);
  } else {
    signedAmount = Math.abs(amount);
  }

  user.walletBalance = Math.max(0, user.walletBalance + signedAmount);
  await user.save();

  await WalletTransaction.create({
    user: userId,
    type,
    amount: Math.abs(amount),
    signedAmount,
    balanceAfter: user.walletBalance,
    vehicleReturn: vehicleReturnId,
    booking: bookingId,
    description
  });

  return user.walletBalance;
}

// ─────────────────────────────────────────────────────────────────
// POST /api/returns  (user) — submit a return request for a booking
// ─────────────────────────────────────────────────────────────────
exports.submitReturnRequest = async (req, res) => {
  try {
    const { bookingId, notes } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    const booking = await Booking.findById(bookingId).populate('car');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This booking does not belong to you' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Only confirmed bookings can be returned' });
    }

    const existing = await VehicleReturn.findOne({ booking: bookingId, status: 'pending' });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A return request for this booking is already pending review' });
    }

    const now = new Date();
    const scheduledEnd = new Date(booking.endDate);
    const lateMs = now - scheduledEnd;
    const lateDays = lateMs > 0 ? Math.ceil(lateMs / msPerDay) : 0;

    const dailyRate = booking.car.pricePerDay || 0;
    const lateFineAmount = Math.round(lateDays * dailyRate * FINE_RATE_PER_DAY);

    const vehicleReturn = await VehicleReturn.create({
      booking: booking._id,
      user: req.user._id,
      car: booking.car._id,
      requestedReturnAt: now,
      userNotes: notes || '',
      scheduledEndDate: scheduledEnd,
      lateDays,
      lateFineAmount,
      depositAmount: booking.car.depositAmount || 0,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Return request submitted. An admin will review it shortly.',
      data: vehicleReturn
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting return request', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/returns  (admin) — list all return requests, filterable by status
// ─────────────────────────────────────────────────────────────────
exports.getAllReturnRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const returns = await VehicleReturn.find(filter)
      .populate('user', 'name email phone')
      .populate('car', 'name brand model pricePerDay depositAmount')
      .populate('booking', 'startDate endDate totalPrice')
      .populate('damageReport')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: returns.length, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching return requests', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/returns/my  (user) — my own return requests
// ─────────────────────────────────────────────────────────────────
exports.getMyReturnRequests = async (req, res) => {
  try {
    const returns = await VehicleReturn.find({ user: req.user._id })
      .populate('car', 'name brand model')
      .populate('booking', 'startDate endDate totalPrice')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: returns.length, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching your return requests', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/returns/:id  (admin or owning user)
// ─────────────────────────────────────────────────────────────────
exports.getReturnRequestById = async (req, res) => {
  try {
    const vehicleReturn = await VehicleReturn.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('car')
      .populate('booking')
      .populate('damageReport');

    if (!vehicleReturn) {
      return res.status(404).json({ success: false, message: 'Return request not found' });
    }
    if (req.user.role !== 'admin' && vehicleReturn.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this return request' });
    }

    res.json({ success: true, data: vehicleReturn });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching return request', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// PUT /api/returns/:id/link-damage  (admin) — attach an existing damage
// report's cost to this return before approving
// ─────────────────────────────────────────────────────────────────
exports.linkDamageReport = async (req, res) => {
  try {
    const { damageReportId, damageCost } = req.body;

    const vehicleReturn = await VehicleReturn.findById(req.params.id);
    if (!vehicleReturn) {
      return res.status(404).json({ success: false, message: 'Return request not found' });
    }
    if (vehicleReturn.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only modify a pending return request' });
    }

    if (damageReportId) {
      const damageReport = await DamageReport.findById(damageReportId);
      if (!damageReport) {
        return res.status(404).json({ success: false, message: 'Damage report not found' });
      }
      vehicleReturn.damageReport = damageReport._id;
      vehicleReturn.damageCost = damageCost != null ? Number(damageCost) : (damageReport.actualCost || damageReport.estimatedCost || 0);
    } else {
      vehicleReturn.damageReport = null;
      vehicleReturn.damageCost = damageCost != null ? Number(damageCost) : 0;
    }

    await vehicleReturn.save();

    res.json({ success: true, message: 'Damage info updated', data: vehicleReturn });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error linking damage report', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// PUT /api/returns/:id/approve  (admin) — settle the return:
// fine + damage cost vs deposit, credit/debit wallet, complete booking
// ─────────────────────────────────────────────────────────────────
exports.approveReturnRequest = async (req, res) => {
  try {
    const { adminFineOverride, adminNotes } = req.body;

    const vehicleReturn = await VehicleReturn.findById(req.params.id).populate('booking').populate('car');
    if (!vehicleReturn) {
      return res.status(404).json({ success: false, message: 'Return request not found' });
    }
    if (vehicleReturn.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This return request has already been reviewed' });
    }

    const fineAmount = adminFineOverride != null
      ? Number(adminFineOverride)
      : vehicleReturn.lateFineAmount;

    const totalFine = Math.max(0, fineAmount + (vehicleReturn.damageCost || 0));
    const deposit = vehicleReturn.depositAmount || 0;

    let amountDeductedFromDeposit = 0;
    let amountRefundedToWallet = 0;
    let outstandingFine = 0;

    if (deposit >= totalFine) {
      // Deposit fully covers the fine — remainder goes to wallet
      amountDeductedFromDeposit = totalFine;
      amountRefundedToWallet = deposit - totalFine;
      outstandingFine = 0;
    } else {
      // Deposit doesn't cover it — whole deposit is consumed, rest is owed
      amountDeductedFromDeposit = deposit;
      amountRefundedToWallet = 0;
      outstandingFine = totalFine - deposit;
    }

    // Credit any leftover deposit to the user's wallet
    if (amountRefundedToWallet > 0) {
      await applyWalletTransaction({
        userId: vehicleReturn.user,
        type: 'deposit_refund',
        amount: amountRefundedToWallet,
        description: `Deposit refund after return — booking ${vehicleReturn.booking._id}`,
        vehicleReturnId: vehicleReturn._id,
        bookingId: vehicleReturn.booking._id
      });
    }

    // If there's an outstanding fine with no deposit to cover it, block new bookings
    if (outstandingFine > 0) {
      await User.findByIdAndUpdate(vehicleReturn.user, { bookingBlocked: true });
    }

    vehicleReturn.adminFineOverride = adminFineOverride != null ? Number(adminFineOverride) : null;
    vehicleReturn.adminNotes = adminNotes || '';
    vehicleReturn.totalFine = totalFine;
    vehicleReturn.amountDeductedFromDeposit = amountDeductedFromDeposit;
    vehicleReturn.amountRefundedToWallet = amountRefundedToWallet;
    vehicleReturn.outstandingFine = outstandingFine;
    vehicleReturn.status = 'approved';
    vehicleReturn.reviewedBy = req.user._id;
    vehicleReturn.reviewedAt = new Date();
    await vehicleReturn.save();

    // Complete the booking and free up the car
    await Booking.findByIdAndUpdate(vehicleReturn.booking._id, { status: 'completed' });
    await Car.findByIdAndUpdate(vehicleReturn.car, { available: true });

    res.json({
      success: true,
      message: 'Return approved and settled successfully',
      data: vehicleReturn
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error approving return request', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// PUT /api/returns/:id/reject  (admin)
// ─────────────────────────────────────────────────────────────────
exports.rejectReturnRequest = async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const vehicleReturn = await VehicleReturn.findById(req.params.id);
    if (!vehicleReturn) {
      return res.status(404).json({ success: false, message: 'Return request not found' });
    }
    if (vehicleReturn.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This return request has already been reviewed' });
    }

    vehicleReturn.status = 'rejected';
    vehicleReturn.adminNotes = adminNotes || '';
    vehicleReturn.reviewedBy = req.user._id;
    vehicleReturn.reviewedAt = new Date();
    await vehicleReturn.save();

    res.json({ success: true, message: 'Return request rejected', data: vehicleReturn });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error rejecting return request', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/wallet  (user) — balance + recent transactions
// ─────────────────────────────────────────────────────────────────
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance bookingBlocked');
    const transactions = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        balance: user.walletBalance,
        bookingBlocked: user.bookingBlocked,
        transactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching wallet', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/wallet/pay-fine  (user) — pay outstanding fine from wallet balance
// ─────────────────────────────────────────────────────────────────
exports.payFineFromWallet = async (req, res) => {
  try {
    const { vehicleReturnId } = req.body;

    const vehicleReturn = await VehicleReturn.findById(vehicleReturnId);
    if (!vehicleReturn) {
      return res.status(404).json({ success: false, message: 'Return request not found' });
    }
    if (vehicleReturn.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (vehicleReturn.outstandingFine <= 0) {
      return res.status(400).json({ success: false, message: 'There is no outstanding fine on this return' });
    }

    const user = await User.findById(req.user._id);
    if (user.walletBalance < vehicleReturn.outstandingFine) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You need ₹${vehicleReturn.outstandingFine} but only have ₹${user.walletBalance}.`
      });
    }

    await applyWalletTransaction({
      userId: user._id,
      type: 'fine_payment',
      amount: vehicleReturn.outstandingFine,
      description: `Fine payment for return ${vehicleReturn._id}`,
      vehicleReturnId: vehicleReturn._id,
      bookingId: vehicleReturn.booking
    });

    vehicleReturn.outstandingFine = 0;
    await vehicleReturn.save();

    // Unblock bookings if this user has no other outstanding fines
    const stillOwes = await VehicleReturn.exists({ user: user._id, outstandingFine: { $gt: 0 } });
    if (!stillOwes) {
      await User.findByIdAndUpdate(user._id, { bookingBlocked: false });
    }

    res.json({ success: true, message: 'Fine paid successfully from wallet balance' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error paying fine', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/wallet/withdraw  (user) — dummy withdrawal, instantly deducts
// ─────────────────────────────────────────────────────────────────
exports.withdrawFromWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid withdrawal amount' });
    }

    const user = await User.findById(req.user._id);
    if (user.walletBalance < withdrawAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const newBalance = await applyWalletTransaction({
      userId: user._id,
      type: 'withdrawal',
      amount: withdrawAmount,
      description: 'Withdrawal to bank account (demo)'
    });

    res.json({
      success: true,
      message: `₹${withdrawAmount} withdrawn successfully (demo — no real transfer occurs)`,
      data: { balance: newBalance }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing withdrawal', error: error.message });
  }
};