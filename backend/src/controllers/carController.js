const Car = require('../models/Car');

// Shared list of all numeric fields on the Car model
const NUMERIC_FIELDS = [
  'year', 'pricePerDay', 'pricePerHour', 'depositAmount',
  'seats', 'doors', 'bootSpaceL',
  'engineCC', 'horsepower', 'torqueNm', 'topSpeedKmh', 'zeroTo100',
  'mileage', 'evRangeKm', 'fuelTankL', 'batteryKwh', 'odometerKm'
];

// Allowlist for admin updates — prevents overwriting _id, rating, timestamps, etc.
const UPDATABLE_FIELDS = [
  'name', 'brand', 'model', 'year', 'color', 'licensePlate',
  'pricePerDay', 'pricePerHour', 'depositAmount',
  'category', 'fuelType', 'transmission',
  'seats', 'doors', 'bootSpaceL',
  'engineCC', 'engineType', 'horsepower', 'torqueNm', 'topSpeedKmh', 'zeroTo100',
  'mileage', 'evRangeKm', 'fuelTankL', 'batteryKwh',
  'features', 'safetyFeatures', 'comfortFeatures', 'entertainmentFeatures',
  'images', 'location', 'available',
  'description', 'highlights', 'odometerKm', 'lastServicedAt'
];

/**
 * Coerce numeric string fields to numbers.
 * Empty string → null (so optional fields don't fail validation).
 */
function coerceNumerics(body) {
  const result = { ...body };
  NUMERIC_FIELDS.forEach(f => {
    if (result[f] === '' || result[f] === undefined) {
      result[f] = null;
    } else if (result[f] !== null) {
      const n = Number(result[f]);
      result[f] = isNaN(n) ? null : n;
    }
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────
// GET /api/cars
// ─────────────────────────────────────────────────────────────────
exports.getAllCars = async (req, res) => {
  try {
    const {
      category, fuelType, transmission, location,
      minPrice, maxPrice, minSeats, available,
      search, sortBy = 'createdAt', order = 'desc',
      page = 1, limit = 12
    } = req.query;

    const filter = {};

    if (category)    filter.category     = category;
    if (fuelType)    filter.fuelType     = fuelType;
    if (transmission) filter.transmission = transmission;
    if (location)    filter.location     = new RegExp(location, 'i');
    if (minSeats)    filter.seats        = { $gte: Number(minSeats) };

    if (available !== undefined) filter.available = available === 'true';

    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }

    if (search) filter.$text = { $search: search };

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const [cars, total] = await Promise.all([
      Car.find(filter)
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Car.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: cars.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: cars
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching cars', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/cars/featured
// ─────────────────────────────────────────────────────────────────
exports.getFeaturedCars = async (req, res) => {
  try {
    const cars = await Car.find({ available: true })
      .sort({ rating: -1 })
      .limit(6);
    res.json({ success: true, count: cars.length, data: cars });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching featured cars', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/cars/:id
// ─────────────────────────────────────────────────────────────────
exports.getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching car', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/cars  (admin only)
// ─────────────────────────────────────────────────────────────────
exports.createCar = async (req, res) => {
  try {
    const body = coerceNumerics(req.body);
    const car  = await Car.create(body);
    res.status(201).json({ success: true, message: 'Car created successfully', data: car });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating car', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// PUT /api/cars/:id  (admin only)
// ─────────────────────────────────────────────────────────────────
exports.updateCar = async (req, res) => {
  try {
    // 1. Strip to allowlist
    const raw = {};
    UPDATABLE_FIELDS.forEach(f => {
      if (req.body[f] !== undefined) raw[f] = req.body[f];
    });

    // 2. Coerce numerics
    const update = coerceNumerics(raw);

    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });

    res.json({ success: true, message: 'Car updated successfully', data: car });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating car', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// DELETE /api/cars/:id  (admin only)
// ─────────────────────────────────────────────────────────────────
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting car', error: error.message });
  }
};