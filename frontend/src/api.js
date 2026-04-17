import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://tienda-ion.onrender.com',
});

// ── Token en cada petición ──────────────────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ────────────────────────────────────────────────────────────
export const register = (data) => API.post('/api/auth/register', data);
export const login    = (data) => API.post('/api/auth/login',    data);
export const getMe    = ()     => API.get('/api/auth/me');

// ── Products ────────────────────────────────────────────────────────
export const getProducts = (params) => API.get('/api/products',      { params });
export const getProduct  = (id)     => API.get(`/api/products/${id}`);

// ── Orders ──────────────────────────────────────────────────────────
export const createOrder = (data) => API.post('/api/orders',     data);
export const getMyOrders = ()     => API.get('/api/orders/my');
// ── Orders (Admin) ──────────────────────────────────────────────────
export const getOrders    = (params) => API.get('/api/orders',          { params });
export const getOrder     = (id)     => API.get(`/api/orders/${id}`);
export const updateOrder  = (id, data) => API.put(`/api/orders/${id}`,  data);
export const deleteOrder  = (id)     => API.delete(`/api/orders/${id}`);

export default API;