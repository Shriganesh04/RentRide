const mongoose = require('mongoose');

const damageReportSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: [true, 'Please provide a description of the damage'],
    trim: true
  },
  images: [{ type: String }],

  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'resolved'],
    default: 'pending'
  },

  estimatedCost: { type: Number, default: 0, min: 0 },
  actualCost: { type: Number, default: null, min: 0 },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paymentId: { type: String, default: null },

  adminNotes: { type: String, trim: true, default: '' },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: { type: Date, default: null }

}, { timestamps: true });

module.exports = mongoose.model('DamageReport', damageReportSchema);