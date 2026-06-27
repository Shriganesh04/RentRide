const mongoose = require('mongoose');

const vehicleReturnSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },

  // ── Submitted by user ────────────────────────────────────────────
  requestedReturnAt: {
    type: Date,
    default: Date.now      // when the user actually submitted this request
  },
  userNotes: {
    type: String,
    default: ''
  },

  // ── Computed at submission time (also re-checked by admin) ──────
  scheduledEndDate: {
    type: Date,
    required: true          // snapshot of booking.endDate at request time
  },
  lateDays: {
    type: Number,
    default: 0,
    min: 0
  },
  lateFineAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  // ── Admin review ──────────────────────────────────────────────────
  damageReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DamageReport',
    default: null
  },
  damageCost: {
    type: Number,
    default: 0,
    min: 0
  },
  adminFineOverride: {
    type: Number,
    default: null            // if set, used instead of the computed lateFineAmount
  },
  adminNotes: {
    type: String,
    default: ''
  },

  // ── Settlement outcome ───────────────────────────────────────────
  depositAmount: {
    type: Number,
    default: 0          // snapshot of car.depositAmount at booking time
  },
  totalFine: {
    type: Number,
    default: 0          // final fine + damage cost, after admin review
  },
  amountDeductedFromDeposit: {
    type: Number,
    default: 0
  },
  amountRefundedToWallet: {
    type: Number,
    default: 0          // remaining deposit credited to wallet, if any
  },
  outstandingFine: {
    type: Number,
    default: 0          // unpaid portion if deposit didn't cover the full fine
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

vehicleReturnSchema.index({ user: 1, createdAt: -1 });
vehicleReturnSchema.index({ status: 1 });

module.exports = mongoose.model('VehicleReturn', vehicleReturnSchema);