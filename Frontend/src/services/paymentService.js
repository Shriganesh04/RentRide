import api from './api';

/**
 * Create Razorpay Order
 * @param {Object} orderData - { bookingId }
 * @returns {Promise<Object>} Order response
 */
const createOrder = async (orderData) => {
  try {
    const response = await api.post('/payments/process', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error.response?.data || error;
  }
};

/**
 * Verify Payment after Razorpay success
 * @param {Object} paymentData - { orderId, paymentId, signature }
 * @returns {Promise<Object>} Verification response
 */
const verifyPayment = async (paymentData) => {
  try {
    const response = await api.post('/payments/verify', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error.response?.data || error;
  }
};

/**
 * Create Damage Payment Order
 * @param {String} damageReportId
 * @returns {Promise<Object>} Order response
 */
const createDamageOrder = async (damageReportId) => {
  try {
    const response = await api.post('/payments/process-damage', { damageReportId });
    return response.data;
  } catch (error) {
    console.error('Error creating damage order:', error);
    throw error.response?.data || error;
  }
};

/**
 * Verify Damage Payment after Razorpay success
 * @param {Object} paymentData - { orderId, paymentId, signature, damageReportId }
 * @returns {Promise<Object>} Verification response
 */
const verifyDamagePayment = async (paymentData) => {
  try {
    const response = await api.post('/payments/verify-damage', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying damage payment:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get Payment History for logged-in user
 * @returns {Promise<Object>} Payment history
 */
const getPaymentHistory = async () => {
  try {
    const response = await api.get('/payments/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error.response?.data || error;
  }
};

/**
 * Export all payment service functions
 */
export const paymentService = {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  createDamageOrder,
  verifyDamagePayment
};

export default paymentService;