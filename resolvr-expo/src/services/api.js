/**
 * API Service
 * Handles all HTTP requests to backend
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.0.124:5000/api'; // Your machine's IP
// Android emulator alternative: http://10.0.2.2:5000/api
// Change to your computer IP for physical device: http://192.168.1.XXX:5000/api

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// ============ Authentication ============
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  toggleOnCall: () => api.put('/auth/on-call'),
  logout: () => api.post('/auth/logout'),
};

// ============ Projects ============
export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  addMember: (id, userId) => api.post(`/projects/${id}/members`, { userId }),
  setOnCall: (id, userIds) => api.put(`/projects/${id}/on-call`, { userIds }),
};

// ============ Issues ============
export const issueAPI = {
  getAll: (params) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  create: (data) => api.post('/issues', data),
  update: (id, data) => api.put(`/issues/${id}`, data),
  addComment: (id, text) => api.post(`/issues/${id}/comments`, { text }),
  getKanban: (projectId) => api.get(`/issues/kanban/${projectId}`),
};

// ============ Incidents ============
export const incidentAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  getById: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post('/incidents', data),
  acknowledge: (id) => api.post(`/incidents/${id}/acknowledge`),
  resolve: (id, notes) => api.put(`/incidents/${id}/resolve`, { resolutionNotes: notes }),
};

// ============ Users ============
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getStats: (id) => api.get(`/users/${id}/stats`),
};

// ============ Notifications ============
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;
