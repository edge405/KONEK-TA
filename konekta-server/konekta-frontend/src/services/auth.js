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
    const response = await api.patch('/auth/profile/', data);
    return response.data;
  },
};
