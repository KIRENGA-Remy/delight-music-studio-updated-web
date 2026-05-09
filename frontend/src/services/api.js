import axios from 'axios';

export const API_BASE    = 'https://delightmusicstudio.onrender.com';
export const UPLOADS_URL = `${API_BASE}`;  

const api = axios.create({
  baseURL: `${API_BASE}/api`,
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

/** Build full URL for an uploaded file path like /uploads/xxx.mp3 */
export function fileUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

export default api;
