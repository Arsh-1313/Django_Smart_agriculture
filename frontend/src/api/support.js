import apiClient from './client';

export const supportAPI = {
  createComplaint: (data) => apiClient.post('/support/complaints/', data),
  getMyComplaints: () => apiClient.get('/support/complaints/'),
  getComplaintDetail: (id) => apiClient.get(`/support/complaints/${id}/`),
};

export default supportAPI;
