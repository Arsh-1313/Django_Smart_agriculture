import client from './client';

export const notificationsApi = {
  getNotifications: async (unreadOnly = false, limit = 50) => {
    const res = await client.get('/notifications/', {
      params: { unread_only: unreadOnly, limit }
    });
    return res.data;
  },

  markAsRead: async (id) => {
    const res = await client.put(`/notifications/${id}/read/`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await client.put('/notifications/read-all/');
    return res.data;
  },
};

export default notificationsApi;
