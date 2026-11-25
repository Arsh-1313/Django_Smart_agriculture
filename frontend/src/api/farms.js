import apiClient from './client';

export const farmsAPI = {
  getFarms: () => apiClient.get('/farms/'),
  createFarm: (data) => apiClient.post('/farms/', data),
  getFarmDetail: (farmId) => apiClient.get(`/farms/${farmId}/`),
  updateFarm: (farmId, data) => apiClient.put(`/farms/${farmId}/`, data),
  deleteFarm: (farmId) => apiClient.delete(`/farms/${farmId}/`),

  // Soil details
  getFarmSoil: (farmId) => apiClient.get(`/farms/${farmId}/soil/`),
  getLatestSoil: (farmId) => apiClient.get(`/farms/${farmId}/soil/latest/`),
  addSoilRecord: (farmId, data) => apiClient.post(`/farms/${farmId}/soil/`, data),
  deleteSoilRecord: (soilId) => apiClient.delete(`/farms/soil/${soilId}/`),

  // Cultivation history
  getFarmHistory: (farmId) => apiClient.get(`/farms/${farmId}/history/`),
  addFarmHistory: (farmId, data) => apiClient.post(`/farms/${farmId}/history/`),
};

export default farmsAPI;
