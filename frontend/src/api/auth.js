import apiClient from './client';

export const authAPI = {
  register: (data) => apiClient.post('/auth/register/', data),
  login: (credentials) => apiClient.post('/auth/login/', credentials),
  refresh: (refreshToken) => apiClient.post('/auth/refresh/', { refresh: refreshToken }),
  getProfile: () => apiClient.get('/auth/profile/'),
  updateProfile: (data) => apiClient.put('/auth/profile/', data),
  logout: () => apiClient.post('/auth/logout/'),
};
