const DamageReport = require('../models/DamageReport');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { ErrorResponse } = require('../middleware/errorHandler');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @route   GET /api/damages
// @access  Private
exports.getAllDamageReports = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };

    const damageReports = await DamageReport.find(query)
      .populate('booking')
      .populate('user', 'name email')
      .populate('car', 'brand model')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: damageReports.length,
      data: damageReports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get damage report by ID
// @route   GET /api/damages/:id
// @access  Private
exports.getDamageReportById = async (req, res, next) => {
  try {
    const damageReport = await DamageReport.findById(req.params.id)
      .populate('booking')
      .populate('user', 'name email')
      .populate('car', 'brand model');

    if (!damageReport) {
      return next(new ErrorResponse('Damage report not found', 404));
    }

    // Check if user owns this report or is admin
    if (damageReport.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized', 401));
    }

    res.status(200).json({
      success: true,
      data: damageReport
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create damage report
// @route   POST /api/damages
// @access  Private
exports.createDamageReport = async (req, res, next) => {
  try {
    const { bookingId, description } = req.body;

    // Verify booking exists and user owns it
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    if (booking.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized', 401));
    }

    // Upload images to Cloudinary
    const imageUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'damage-reports',
                transformation: [
                  { width: 1200, height: 900, crop: 'limit' },
                  { quality: 'auto' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(file.buffer);
          });

          imageUrls.push(uploadResult.secure_url);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
    }

    const damageReportData = {
      booking: bookingId,
      user: req.user.id,
      car: booking.car,
      description,
      images: imageUrls,
      status: 'pending',
      estimatedCost: 0 // Admin sets the real cost during review (see actualCost)
    };

    const damageReport = await DamageReport.create(damageReportData);

    res.status(201).json({
      success: true,
      data: damageReport
    });

  } catch (error) {
    console.error('Create damage report error:', error);
    next(error);
  }
};

// @desc    Update damage report (Admin only)
// @route   PUT /api/damages/:id
// @access  Private/Admin
exports.updateDamageReport = async (req, res, next) => {
  try {
    let damageReport = await DamageReport.findById(req.params.id);

    if (!damageReport) {
      return next(new ErrorResponse('Damage report not found', 404));
    }

    damageReport = await DamageReport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: damageReport
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete damage report
// @route   DELETE /api/damages/:id
// @access  Private/Admin
exports.deleteDamageReport = async (req, res, next) => {
  try {
    const damageReport = await DamageReport.findById(req.params.id);

    if (!damageReport) {
      return next(new ErrorResponse('Damage report not found', 404));
    }

    await damageReport.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get damage stats for a car
// @route   GET /api/damages/car/:carId/stats
// @access  Private
exports.getCarDamageStats = async (req, res, next) => {
  try {
    const stats = await DamageReport.aggregate([
      { $match: { car: req.params.carId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCost: { $sum: '$estimatedCost' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// ✅ NEW ADMIN FUNCTIONS
// ========================================

// @desc    Get all pending damage reports (Admin only)
// @route   GET /api/damages/admin/pending
// @access  Private/Admin
exports.getPendingDamageReports = async (req, res, next) => {
  try {
    const damageReports = await DamageReport.find({
      status: { $in: ['pending', 'under_review'] }
    })
      .populate('booking')
      .populate('user', 'name email phone')
      .populate('car', 'brand model registrationNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: damageReports.length,
      data: damageReports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve damage report and set final cost (Admin only)
// @route   PUT /api/damages/:id/approve
// @access  Private/Admin
exports.approveDamageReport = async (req, res, next) => {
  try {
    const { actualCost, adminNotes } = req.body;

    if (!actualCost || actualCost < 0) {
      return next(new ErrorResponse('Please provide a valid cost', 400));
    }

    const damageReport = await DamageReport.findById(req.params.id);

    if (!damageReport) {
      return next(new ErrorResponse('Damage report not found', 404));
    }

    // Update damage report
    damageReport.status = 'approved';
    damageReport.actualCost = actualCost;
    damageReport.adminNotes = adminNotes || '';
    damageReport.reviewedBy = req.user.id;
    damageReport.reviewedAt = new Date();

    await damageReport.save();

    // Populate fields for response
    await damageReport.populate('booking');
    await damageReport.populate('user', 'name email');
    await damageReport.populate('car', 'brand model');

    // Create notification for user
    await Notification.create({
      user: damageReport.user._id,
      type: 'warning',
      title: 'Damage Report Approved',
      message: `Admin has approved the damage report for ${damageReport.car.brand} ${damageReport.car.model}. A repair cost of ₹${actualCost.toLocaleString()} has been charged. Please complete the payment.`
    });

    res.status(200).json({
      success: true,
      message: 'Damage report approved successfully',
      data: damageReport
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject damage report (Admin only)
// @route   PUT /api/damages/:id/reject
// @access  Private/Admin
exports.rejectDamageReport = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;

    if (!adminNotes || adminNotes.trim() === '') {
      return next(new ErrorResponse('Please provide reason for rejection', 400));
    }

    const damageReport = await DamageReport.findById(req.params.id);

    if (!damageReport) {
      return next(new ErrorResponse('Damage report not found', 404));
    }

    damageReport.status = 'rejected';
    damageReport.adminNotes = adminNotes;
    damageReport.reviewedBy = req.user.id;
    damageReport.reviewedAt = new Date();

    await damageReport.save();

    // Populate fields for response
    await damageReport.populate('booking');
    await damageReport.populate('user', 'name email');
    await damageReport.populate('car', 'brand model');

    // Create notification for user
    await Notification.create({
      user: damageReport.user._id,
      type: 'info',
      title: 'Damage Report Rejected',
      message: `The damage report for ${damageReport.car.brand} ${damageReport.car.model} has been rejected by admin. Reason: ${adminNotes}`
    });

    res.status(200).json({
      success: true,
      message: 'Damage report rejected',
      data: damageReport
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark damage as under review (Admin only)
// @route   PUT /api/damages/:id/review
// @access  Private/Admin
exports.setUnderReview = async (req, res, next) => {
  try {
    const damageReport = await DamageReport.findById(req.params.id);

    if (!damageReport) {
      return next(new ErrorResponse('Damage report not found', 404));
    }

    damageReport.status = 'under_review';
    await damageReport.save();

    res.status(200).json({
      success: true,
      message: 'Damage report marked as under review',
      data: damageReport
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's damage reports with status
// @route   GET /api/damages/user/my-reports
// @access  Private
exports.getUserDamageReports = async (req, res, next) => {
  try {
    const damageReports = await DamageReport.find({ user: req.user.id })
      .populate('booking')
      .populate('car', 'brand model registrationNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: damageReports.length,
      data: damageReports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/damages/admin/stats
// @access  Private/Admin
exports.getAdminDamageStats = async (req, res, next) => {
  try {
    const stats = await DamageReport.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEstimatedCost: { $sum: '$estimatedCost' },
          totalActualCost: { $sum: '$actualCost' }
        }
      }
    ]);

    const totalReports = await DamageReport.countDocuments();
    const pendingReports = await DamageReport.countDocuments({
      status: { $in: ['pending', 'under_review'] }
    });

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        pendingReports,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    next(error);
  }
};