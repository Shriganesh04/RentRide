import adminApi from './adminApi'

export const statsService = {
  // Note: this intentionally does NOT catch-and-fabricate data on failure.
  // A dashboard showing confident-looking fake numbers when the API is down
  // is worse than a dashboard that visibly says "couldn't load stats" —
  // the caller (AdminDashboard.jsx) is responsible for handling the error
  // and showing an honest state to the admin.
  getDashboardStats: async () => {
    const response = await adminApi.get('/admin/stats/dashboard')
    return response.data
  },

  getRecentActivity: async (limit = 5) => {
    try {
      const response = await adminApi.get(`/admin/stats/recent-activity?limit=${limit}`)
      return response.data
    } catch (error) {
      console.warn('⚠️ Activity API unavailable, showing no recent activity')
      // Recent activity is non-critical decoration — an empty list here is
      // honest (and harmless), unlike fabricating fake KPI numbers would be.
      return {
        data: {
          bookings: []
        }
      }
    }
  }
}
