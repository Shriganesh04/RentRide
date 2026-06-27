import api from './api';

export const walletService = {
  // Get wallet balance + transaction history
  getWallet: async () => {
    try {
      const response = await api.get('/wallet');
      return response.data;
    } catch (error) {
      console.error('Get wallet error:', error.response?.data || error);
      throw error;
    }
  },

  // Pay an outstanding fine from wallet balance
  payFineFromWallet: async (vehicleReturnId) => {
    try {
      const response = await api.post('/wallet/pay-fine', { vehicleReturnId });
      return response.data;
    } catch (error) {
      console.error('Pay fine error:', error.response?.data || error);
      throw error;
    }
  },

  // Dummy withdrawal — instantly deducts from balance, no real transfer
  withdraw: async (amount) => {
    try {
      const response = await api.post('/wallet/withdraw', { amount });
      return response.data;
    } catch (error) {
      console.error('Withdraw error:', error.response?.data || error);
      throw error;
    }
  }
};

export default walletService;