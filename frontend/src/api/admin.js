import apiClient from './client';

export const adminAPI = {
  // User Management
  getUsers: (params) => apiClient.get('/auth/users/', { params }),
  toggleUserStatus: (userId, isActive) =>
    apiClient.put(`/auth/users/${userId}/status/`, { is_active: isActive }),

  // Platform Analytics & Reports
  getReportsSummary: () => apiClient.get('/admin/reports/summary/'),
  getExportUrl: (type) => `${apiClient.defaults.baseURL}/admin/reports/export/?type=${type}`,

  // Grievance / Complaints Management
  getComplaints: (params) => apiClient.get('/support/complaints/', { params }),
  resolveComplaint: (complaintId, data) =>
    apiClient.put(`/support/complaints/${complaintId}/resolve/`, data),
};

export default adminAPI;
