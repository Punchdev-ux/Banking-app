import axios from 'axios';

// Point this at the Spring Boot server. Override with VITE_API_URL in .env if needed.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  headers: { 'X-Admin-User': 'N' },
});

const data = (promise) => promise.then((res) => res.data);

export const managementService = {
  // Users & Access
  getUsers: () => data(api.get('/users')),
  createUser: (payload) => data(api.post('/users', payload)),
  updateUser: (id, payload) => data(api.put(`/users/${id}`, payload)),
  setUserStatus: (id, status) => data(api.patch(`/users/${id}/status`, { status })),
  deleteUser: (id) => data(api.delete(`/users/${id}`)),

  // Security Controls
  getSecurityPolicy: () => data(api.get('/security/policy')),
  updateSecurityPolicy: (payload) => data(api.put('/security/policy', payload)),
  getSecurityEvents: (limit = 50) => data(api.get('/security/events', { params: { limit } })),
  getSecuritySummary: () => data(api.get('/security/summary')),

  // System Settings
  getSettings: () => data(api.get('/settings')),
  updateSettings: (payload) => data(api.put('/settings', payload)),
};