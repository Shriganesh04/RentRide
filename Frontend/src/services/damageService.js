import api from './api';

// User functions
export const getUserDamageReports = async () => {
  const response = await api.get('/damages/user/my-reports');
  return response.data;
};

export const getDamageReportById = async (id) => {
  const response = await api.get(`/damages/${id}`);
  return response.data;
};

// Admin functions
export const getPendingDamageReports = async () => {
  const response = await api.get('/damages/admin/pending');
  return response.data;
};

export const getAdminDamageStats = async () => {
  const response = await api.get('/damages/admin/stats');
  return response.data;
};

export const approveDamageReport = async (id, data) => {
  const response = await api.put(`/damages/${id}/approve`, data);
  return response.data;
};

export const rejectDamageReport = async (id, data) => {
  const response = await api.put(`/damages/${id}/reject`, data);
  return response.data;
};

export const setUnderReview = async (id) => {
  const response = await api.put(`/damages/${id}/review`, {});
  return response.data;
};

const damageService = {
  getUserDamageReports,
  getDamageReportById,
  getPendingDamageReports,
  getAdminDamageStats,
  approveDamageReport,
  rejectDamageReport,
  setUnderReview
};

export default damageService;