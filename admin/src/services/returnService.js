import adminApi from './adminApi';

export const returnService = {
  // Get all return requests, optionally filtered by status
  getAllReturns: async (status) => {
    const response = await adminApi.get('/returns', { params: status ? { status } : {} });
    return response.data;
  },

  getReturnById: async (id) => {
    const response = await adminApi.get(`/returns/${id}`);
    return response.data;
  },

  // Attach a damage report (and/or manual cost) to a pending return request
  linkDamage: async (returnId, { damageReportId, damageCost }) => {
    const response = await adminApi.put(`/returns/${returnId}/link-damage`, { damageReportId, damageCost });
    return response.data;
  },

  approveReturn: async (returnId, { adminFineOverride, adminNotes } = {}) => {
    const response = await adminApi.put(`/returns/${returnId}/approve`, { adminFineOverride, adminNotes });
    return response.data;
  },

  rejectReturn: async (returnId, adminNotes) => {
    const response = await adminApi.put(`/returns/${returnId}/reject`, { adminNotes });
    return response.data;
  }
};

export default returnService;