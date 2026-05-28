import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.monitoring-bps-kota-jogja.my.id/api',
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;