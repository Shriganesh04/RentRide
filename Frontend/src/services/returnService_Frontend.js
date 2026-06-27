import api from './api';

export const returnService = {
  // Submit a return request for a booking
  submitReturnRequest: async (bookingId, notes = '') => {
    try {
      const response = await api.post('/returns', { bookingId, notes });
      return response.data;
    } catch (error) {
      console.error('Submit return request error:', error.response?.data || error);
      throw error;
    }
  },

  // Get my own return requests
  getMyReturnRequests: async () => {
    try {
      const response = await api.get('/returns/my');
      return response.data;
    } catch (error) {
      console.error('Get my return requests error:', error.response?.data || error);
      throw error;
    }
  },

  // Get a single return request by id (owner or admin)
  getReturnRequestById: async (id) => {
    try {
      const response = await api.get(`/returns/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get return request error:', error.response?.data || error);
      throw error;
    }
  }
};

export default returnService;