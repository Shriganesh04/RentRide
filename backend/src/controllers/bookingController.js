const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Promotion = require('../models/Promotion');

// Create booking with promotion
exports.createBooking = async (req, res) => {
  try {
    const { carId, startDate, endDate, promotionCode, rentalMode } = req.body;

    // Get car details
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check car availability
    if (!car.available) {
      return res.status(400).json({
        success: false,
        message: 'Car is not available'
      });
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range: end date must be after start date'
      });
    }

    // Prevent double-booking — check for overlapping active bookings on this car
    const conflict = await Booking.findOne({
      car: carId,
      status: { $in: ['pending', 'confirmed'] },
      startDate: { $lt: end },
      endDate: { $gt: start }
    });
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'This vehicle is already booked for an overlapping time period.'
      });
    }

    // Determine mode — hourly only valid if car actually has an hourly rate
    const mode = (rentalMode === 'hourly' && car.pricePerHour > 0) ? 'hourly' : 'daily';

    let durationDays = null;
    let durationHours = null;
    let baseFare;

    if (mode === 'hourly') {
      durationHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
      baseFare = car.pricePerHour * durationHours;
    } else {
      durationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      baseFare = car.pricePerDay * durationDays;
    }

    const taxesFees = Math.round(baseFare * 0.12);
    const deposit   = car.depositAmount > 0 ? car.depositAmount : 500;
    let totalPrice  = baseFare + taxesFees + deposit;

    // Apply promotion if provided — discount applies to baseFare, not the final total
    let promotion = null;
    let discount = 0;

    if (promotionCode) {
      promotion = await Promotion.findOne({
        code: promotionCode.toUpperCase()
      });

      if (promotion && promotion.isValid() && promotion.isApplicableToVehicle(carId)) {
        if (baseFare >= promotion.minBookingAmount) {
          discount = promotion.calculateDiscount(baseFare);
          totalPrice = Math.max(0, totalPrice - discount);

          promotion.usedCount += 1;
          await promotion.save();
        }
      }
    }

    // Create booking
    const booking = await Booking.create({
      user: req.user._id,
      car: carId,
      startDate: start,
      endDate: end,
      rentalMode: mode,
      durationDays,
      durationHours,
      promotion: promotion ? promotion._id : null,
      promotionCode: promotionCode || null,
      discount,
      totalPrice
    });

    // Mark the car unavailable while this booking is active
    car.available = false;
    await car.save();

    // Populate car details
    await booking.populate('car', 'name brand model pricePerDay pricePerHour');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// Get all bookings (Admin only)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }
    
    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('car', 'name brand model')
      .populate('promotion', 'code name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Booking.countDocuments(filter);
    
    res.json({
      success: true,
      count: bookings.length,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Get single booking
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('car', 'name brand model pricePerDay')
      .populate('promotion', 'code name type value');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

// Get user's own bookings
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('car', 'name brand model pricePerDay image location')
      .populate('promotion', 'code name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your bookings',
      error: error.message
    });
  }
};

// Cancel booking (User can cancel their own booking)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }
    
    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }
    
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }
    
    // Check if payment is already made
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a paid booking. Please contact support for refund.'
      });
    }
    
    // Update booking status
    booking.status = 'cancelled';
    booking.paymentStatus = 'failed';
    await booking.save();

    // Free up the car so it can be booked again
    await Car.findByIdAndUpdate(booking.car, { available: true });
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

// Update booking (Admin only)
exports.updateBooking = async (req, res) => {
  try {
    // Allowlist — admin can only touch these fields via this endpoint
    const ALLOWED = ['status', 'paymentStatus', 'startDate', 'endDate'];
    const update = {};
    ALLOWED.forEach(f => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).populate('car', 'name brand model');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Free the car when a booking is cancelled or completed.
    // Re-lock it if an admin reactivates a booking back to pending/confirmed.
    if (['cancelled', 'completed'].includes(update.status)) {
      await Car.findByIdAndUpdate(booking.car._id || booking.car, { available: true });
    } else if (['pending', 'confirmed'].includes(update.status)) {
      await Car.findByIdAndUpdate(booking.car._id || booking.car, { available: false });
    }
    
    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
};

// Delete booking (Admin only)
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Free up the car since this booking no longer exists
    await Car.findByIdAndUpdate(booking.car, { available: true });
    
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting booking',
      error: error.message
    });
  }
};