import apiClient from './client';

export const predictionsAPI = {
  predictCrop: (data) => apiClient.post('/predictions/crop/', data),
  predictYield: (data) => apiClient.post('/predictions/yield/', data),
  predictFertilizer: (data) => apiClient.post('/predictions/fertilizer/', data),
  getHistory: () => apiClient.get('/predictions/history/'),
};
