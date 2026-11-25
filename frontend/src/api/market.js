import apiClient from './client';

export const marketAPI = {
  getPrices: (params = {}) => apiClient.get('/market/prices/', { params }),
  getCommodities: () => apiClient.get('/market/commodities/'),
  getStates: () => apiClient.get('/market/states/'),
};
