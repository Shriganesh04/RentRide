const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'deposit_refund',   // credit — remaining deposit returned after fine/damage deduction
      'fine_deduction',    // debit  — late fine or damage cost taken from deposit
      'fine_payment',       // debit  — user manually pays an outstanding fine from balance
      'withdrawal',          // debit  — dummy withdraw to "bank"
      'adjustment'            // admin manual correction, either direction
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // For credits this is +amount, for debits -amount — kept so balance history
  // can be displayed as a running ledger without re-deriving sign from type.
  signedAmount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  vehicleReturn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleReturn',
    default: null
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['completed', 'processing', 'failed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

walletTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);