import apiClient from './client';

export const cropsAPI = {
  getCrops: (params = {}) => apiClient.get('/crops/', { params }),
  getCropDetail: (cropId) => apiClient.get(`/crops/${cropId}/`),
  createCrop: (data) => apiClient.post('/crops/', data),
  updateCropHistory: (historyId, data) => apiClient.put(`/crops/history/${historyId}/`, data),
  deleteCropHistory: (historyId) => apiClient.delete(`/crops/history/${historyId}/`),
};

export default cropsAPI;
