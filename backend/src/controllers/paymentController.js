const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const DamageReport = require('../models/DamageReport');
const { createOrder, verifySignature } = require('../services/paymentService');
const { ErrorResponse } = require('../middleware/errorHandler');

// @desc    Initiate payment for Booking (Create Order)
// @route   POST /api/payments/process
// @access  Private
exports.createPayment = async (req, res, next) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId) {
            return next(new ErrorResponse('bookingId is required', 400));
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return next(new ErrorResponse('Booking not found', 404));
        }

        if (booking.user.toString() !== req.user.id) {
            return next(new ErrorResponse('Not authorized', 401));
        }

        if (booking.paymentStatus === 'paid') {
            return next(new ErrorResponse('Booking already paid', 400));
        }

        // Check if a pending payment already exists for this booking
        let existingPayment = await Payment.findOne({
            booking: bookingId,
            status: 'pending'
        });

        if (existingPayment && existingPayment.orderId) {
            // Return existing order instead of creating new one
            return res.status(200).json({
                success: true,
                order: {
                    id: existingPayment.orderId,
                    amount: existingPayment.amount,
                    currency: 'INR'
                }
            });
        }

        // Create Razorpay Order
        const order = await createOrder(booking.totalPrice || booking.total);

        // Create or update payment record
        if (existingPayment) {
            // Update existing payment with new orderId
            existingPayment.orderId = order.id;
            existingPayment.amount = booking.totalPrice || booking.total;
            await existingPayment.save();
        } else {
            // Create new payment record
            await Payment.create({
                booking: bookingId,
                user: req.user.id,
                amount: booking.totalPrice || booking.total,
                orderId: order.id,
                status: 'pending'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (err) {
        console.error('Payment error:', err);
        next(err);
    }
};

// @desc    Verify Booking Payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        if (!orderId || !paymentId || !signature) {
            return next(new ErrorResponse('Missing required payment verification fields', 400));
        }

        const isSignatureValid = verifySignature(orderId, paymentId, signature);

        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            return next(new ErrorResponse('Payment record not found', 404));
        }

        if (!isSignatureValid) {
            // Record the failed attempt instead of leaving it stuck on 'pending'
            payment.status = 'failed';
            payment.transactionId = paymentId;
            await payment.save();
            return next(new ErrorResponse('Invalid signature', 400));
        }

        payment.transactionId = paymentId;
        payment.status = 'paid';
        await payment.save();

        // Update Booking
        const booking = await Booking.findById(payment.booking);
        if (booking) {
            booking.paymentStatus = 'paid';
            booking.status = 'confirmed';
            await booking.save();
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully'
        });
    } catch (err) {
        console.error('Payment verification error:', err);
        next(err);
    }
};

// @desc    Initiate payment for Damage Report
// @route   POST /api/payments/process-damage
// @access  Private
exports.createDamagePayment = async (req, res, next) => {
    try {
        const { damageReportId } = req.body;

        const damageReport = await DamageReport.findById(damageReportId);

        if (!damageReport) {
            return next(new ErrorResponse('Damage report not found', 404));
        }

        if (damageReport.user.toString() !== req.user.id) {
            return next(new ErrorResponse('Not authorized', 401));
        }

        if (damageReport.paymentStatus === 'paid') {
            return next(new ErrorResponse('Damage report already paid', 400));
        }

        if (damageReport.status !== 'approved') {
            return next(new ErrorResponse('Damage report not approved yet', 400));
        }

        if (!damageReport.actualCost || damageReport.actualCost <= 0) {
            return next(new ErrorResponse('Invalid cost amount', 400));
        }

        // Create Razorpay Order
        const order = await createOrder(damageReport.actualCost);

        // Track this payment so it shows up in payment history (was previously skipped)
        let existingDamagePayment = await Payment.findOne({
            damageReport: damageReportId,
            status: 'pending'
        });

        if (existingDamagePayment) {
            existingDamagePayment.orderId = order.id;
            existingDamagePayment.amount = damageReport.actualCost;
            await existingDamagePayment.save();
        } else {
            await Payment.create({
                damageReport: damageReportId,
                user: req.user.id,
                amount: damageReport.actualCost,
                orderId: order.id,
                status: 'pending'
            });
        }

        res.status(200).json({
            success: true,
            order
        });

    } catch (err) {
        console.error('Damage Payment error:', err);
        next(err);
    }
};

// @desc    Verify Damage Report Payment
// @route   POST /api/payments/verify-damage
// @access  Private
exports.verifyDamagePayment = async (req, res, next) => {
    try {
        const { orderId, paymentId, signature, damageReportId } = req.body;

        const isSignatureValid = verifySignature(orderId, paymentId, signature);

        if (isSignatureValid) {
            // Update DamageReport
            const damageReport = await DamageReport.findById(damageReportId);

            if (!damageReport) {
                return next(new ErrorResponse('Damage report not found', 404));
            }

            damageReport.paymentStatus = 'paid';
            damageReport.paymentId = paymentId;
            damageReport.status = 'resolved'; // Mark as resolved after payment
            await damageReport.save();

            // Update the matching Payment record (was previously skipped — payment
            // history was missing damage payments)
            const payment = await Payment.findOne({ orderId, damageReport: damageReportId });
            if (payment) {
                payment.transactionId = paymentId;
                payment.status = 'paid';
                await payment.save();
            }

            res.status(200).json({
                success: true,
                message: 'Damage payment verified successfully'
            });
        } else {
            return next(new ErrorResponse('Invalid signature', 400));
        }
    } catch (err) {
        console.error('Damage Payment verification error:', err);
        next(err);
    }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = async (req, res, next) => {
    try {
        const payments = await Payment.find({ user: req.user.id }).populate('booking');

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (err) {
        next(err);
    }
};