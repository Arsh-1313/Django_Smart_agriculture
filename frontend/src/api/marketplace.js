import client from './client';

export const marketplaceApi = {
  // Produce Listings
  getListings: async (params = {}) => {
    const res = await client.get('/market/listings/', { params });
    return res.data;
  },

  createListing: async (data) => {
    const res = await client.post('/market/listings/', data);
    return res.data;
  },

  getListing: async (id) => {
    const res = await client.get(`/market/listings/${id}/`);
    return res.data;
  },

  updateListing: async (id, data) => {
    const res = await client.put(`/market/listings/${id}/`, data);
    return res.data;
  },

  deleteListing: async (id) => {
    const res = await client.delete(`/market/listings/${id}/`);
    return res.data;
  },

  getMyListings: async () => {
    const res = await client.get('/market/my-listings/');
    return res.data;
  },

  // Orders
  getOrders: async () => {
    const res = await client.get('/orders/');
    return res.data;
  },

  createOrder: async (data) => {
    const res = await client.post('/orders/', data);
    return res.data;
  },

  getOrder: async (id) => {
    const res = await client.get(`/orders/${id}/`);
    return res.data;
  },

  updateOrderStatus: async (orderId, statusData) => {
    const res = await client.put(`/orders/${orderId}/status/`, statusData);
    return res.data;
  },

  sendInquiry: async (listingId, data) => {
    const res = await client.post(`/market/listings/${listingId}/inquire/`, data);
    return res.data;
  },
};

export default marketplaceApi;
