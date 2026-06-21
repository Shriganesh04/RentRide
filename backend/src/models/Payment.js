const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  damageReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DamageReport',
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  orderId: {
    type: String,        // Razorpay order_id
    default: null
  },
  transactionId: {
    type: String,        // Razorpay payment_id, set on successful verification
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  method: {
    type: String,        // card / upi / netbanking / wallet, if you want to capture it later
    default: null
  }
}, {
  timestamps: true
});

paymentSchema.index({ booking: 1 });
paymentSchema.index({ damageReport: 1 });
paymentSchema.index({ orderId: 1 });
// sparse: only indexes documents where transactionId actually has a value,
// so multiple pending payments with transactionId: null never collide.
paymentSchema.index({ transactionId: 1 }, { sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);