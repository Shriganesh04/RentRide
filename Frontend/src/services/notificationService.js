import api from './api';

const getUserNotifications = async () => {
    try {
        const response = await api.get('/notifications');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const markAsRead = async (id) => {
    try {
        const response = await api.put(`/notifications/${id}/read`, {});
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const markAllRead = async () => {
    try {
        const response = await api.put('/notifications/read-all', {});
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const deleteNotification = async (id) => {
    try {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const clearAllNotifications = async () => {
    try {
        const response = await api.delete('/notifications/clear-all');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const notificationService = {
    getUserNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
    clearAllNotifications
};