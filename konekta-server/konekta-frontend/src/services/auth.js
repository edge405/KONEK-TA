import api from '../lib/api';

export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  login: async (data) => {
    const response = await api.post('/auth/login/', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (data) => {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    const response = await api.patch('/auth/profile/', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },


  changePassword: async (data) => {
    const response = await api.post('/auth/password/change/', data);
    return response.data;
  },

  getNotificationSettings: async () => {
    const response = await api.get('/auth/settings/notifications/');
    return response.data;
  },

  updateNotificationSettings: async (data) => {
    const response = await api.patch('/auth/settings/notifications/', data);
    return response.data;
  },

  getPrivacySettings: async () => {
    const response = await api.get('/auth/settings/privacy/');
    return response.data;
  },

  updatePrivacySettings: async (data) => {
    const response = await api.patch('/auth/settings/privacy/', data);
    return response.data;
  },

  exportData: async () => {
    const response = await api.get('/auth/export-data/');
    return response.data;
  },

  deleteAccount: async (data) => {
    const response = await api.post('/auth/delete-account/', data);
    return response.data;
  },
};

