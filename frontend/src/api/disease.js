import client from './client';

export const diseaseApi = {
  detectDisease: async (formData) => {
    const res = await client.post('/disease/detect/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getHistory: async () => {
    const res = await client.get('/disease/history/');
    return res.data;
  },
};

export default diseaseApi;
