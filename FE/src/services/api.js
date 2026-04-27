import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== CUSTOM API METHODS ====================
export const getPendingCount = () => api.get('/admin/requests/pending-count');
export const markNotified = (ids) => api.post('/ownership/mark-notified', { ids });

export default api;