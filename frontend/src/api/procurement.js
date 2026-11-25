import client from './client';

export const procurementApi = {
  getCentres: async (params = {}) => {
    const res = await client.get('/procurement/centres/', { params });
    return res.data;
  },

  getCentre: async (id) => {
    const res = await client.get(`/procurement/centres/${id}/`);
    return res.data;
  },

  getSlots: async (centreId, date = '') => {
    const params = date ? { date } : {};
    const res = await client.get(`/procurement/centres/${centreId}/slots/`, { params });
    return res.data;
  },

  createBooking: async (data) => {
    const res = await client.post('/procurement/bookings/', data);
    return res.data;
  },

  getBookings: async (params = {}) => {
    const res = await client.get('/procurement/bookings/', { params });
    return res.data;
  },

  updateBookingStatus: async (bookingId, statusData) => {
    const res = await client.put(`/procurement/bookings/${bookingId}/status/`, statusData);
    return res.data;
  },
};

export default procurementApi;
