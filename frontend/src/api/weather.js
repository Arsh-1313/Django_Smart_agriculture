import apiClient from './client';

export const weatherAPI = {
  getCurrent: (params = {}) => apiClient.get('/weather/current/', { params }),
  getForecast: (params = {}) => apiClient.get('/weather/forecast/', { params }),
  geocode: (query) => apiClient.get('/weather/geocode/', { params: { q: query } }),
};
