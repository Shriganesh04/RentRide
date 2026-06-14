const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({

  // ── Core identity ──────────────────────────────────────────────
  name:         { type: String, required: [true, 'Please provide car name'], trim: true },
  brand:        { type: String, required: [true, 'Please provide car brand'], trim: true },
  model:        { type: String, required: [true, 'Please provide car model'], trim: true },
  year:         { type: Number, required: [true, 'Please provide manufacturing year'] },
  color:        { type: String, required: true, trim: true },
  licensePlate: { type: String, trim: true, default: null },

  // ── Pricing ────────────────────────────────────────────────────
  pricePerDay:   { type: Number, required: [true, 'Please provide price per day'], min: 0 },
  pricePerHour:  { type: Number, min: 0, default: null },
  depositAmount: { type: Number, default: 0, min: 0 },

  // ── Classification ─────────────────────────────────────────────
  category: {
    type: String,
    enum: ['sedan', 'suv', 'hatchback', 'luxury', 'sports', 'electric', 'minivan', 'pickup'],
    required: true
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'],
    required: true
  },
  transmission: {
    type: String,
    enum: ['manual', 'automatic', 'cvt', 'amt'],
    required: true
  },

  // ── Capacity ───────────────────────────────────────────────────
  seats:      { type: Number, required: true, min: 2, max: 12 },
  doors:      { type: Number, default: 4, min: 2, max: 5 },
  bootSpaceL: { type: Number, default: null },   // litres

  // ── Performance ────────────────────────────────────────────────
  engineCC:    { type: Number, default: null },  // e.g. 1998
  engineType:  { type: String, trim: true, default: null },  // e.g. "2.0L Turbo"
  horsepower:  { type: Number, default: null },  // bhp
  torqueNm:    { type: Number, default: null },  // Nm
  topSpeedKmh: { type: Number, default: null },
  zeroTo100:   { type: Number, default: null },  // seconds

  // ── Efficiency ─────────────────────────────────────────────────
  mileage:    { type: Number, default: null },   // km/l (ICE)
  evRangeKm:  { type: Number, default: null },   // km (EV/Hybrid)
  fuelTankL:  { type: Number, default: null },   // litres
  batteryKwh: { type: Number, default: null },   // kWh (EV)

  // ── Features (grouped) ─────────────────────────────────────────
  features:              [{ type: String }],   // general / backward-compat
  safetyFeatures:        [{ type: String }],   // ABS, airbags, ADAS, etc.
  comfortFeatures:       [{ type: String }],   // sunroof, heated seats, etc.
  entertainmentFeatures: [{ type: String }],   // Apple CarPlay, JBL, etc.

  // ── Media ──────────────────────────────────────────────────────
  images: [{ type: String }],

  // ── Location & availability ────────────────────────────────────
  location:  { type: String, required: true },
  available: { type: Boolean, default: true },

  // ── Ratings ────────────────────────────────────────────────────
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },

  // ── Content ────────────────────────────────────────────────────
  description: { type: String, trim: true },
  highlights:  [{ type: String }],  // bullet selling points

  // ── Service history ────────────────────────────────────────────
  odometerKm:     { type: Number, default: null },
  lastServicedAt: { type: Date,   default: null }

}, { timestamps: true });

// Full-text search
carSchema.index({ name: 'text', brand: 'text', model: 'text', description: 'text' });

module.exports = mongoose.model('Car', carSchema);