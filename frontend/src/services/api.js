import axios from 'axios';

const api = axios.create({
  baseURL: 'https://delightmusicstudio.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('dm_token');
      localStorage.removeItem('dm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
