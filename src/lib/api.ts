import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-new.botpl.ru/api/v1';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://api.tgbotbuyss.ru/api/v1';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (identifier: string, password: string) => {
  const response = await api.post('/auth/login', { identifier, password });
  return response.data;
};

export const logout = async (token: string) => {
  const response = await api.post('/auth/logout', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getCurrentUser = async (token: string) => {
  const response = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
};

// CRUD operations for different resources
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export const accessoriesAPI = {
  getAll: () => api.get('/accessories'),
  getById: (id: number) => api.get(`/accessories/${id}`),
  create: (data: any) => api.post('/accessories', data),
  update: (id: number, data: any) => api.put(`/accessories/${id}`, data),
  delete: (id: number) => api.delete(`/accessories/${id}`),
};

export const servicesAPI = {
  getAll: () => api.get('/services'),
  getById: (id: number) => api.get(`/services/${id}`),
  create: (data: any) => api.post('/services', data),
  update: (id: number, data: any) => api.put(`/services/${id}`, data),
  delete: (id: number) => api.delete(`/services/${id}`),
};

export const telegramMessagesAPI = {
  getAll: (params?: any) => api.get('/tg-messages', { params }),
  getById: (id: number) => api.get(`/tg-messages/${id}`),
  create: (data: any) => api.post('/tg-messages', data),
};

// Boshqa API funksiyalari...

export default api;