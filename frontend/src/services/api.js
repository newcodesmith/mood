import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mood--backend-9b77c9379b8b.herokuapp.com/api';

const API = axios.create({
  baseURL: API_BASE_URL
});

const TOKEN_KEY = 'mood_tracker_token';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const setAuthToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

API.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: async (authData) => {
    const response = await API.post('/auth/register', authData);
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },
  me: () => API.get('/auth/me'),
  forgotPassword: (payload) => API.post('/auth/forgot-password', payload),
  resetPassword: (payload) => API.post('/auth/reset-password', payload)
};

export const userService = {
  getAll: () => API.get('/users'),
  getById: (id) => API.get(`/users/${id}`),
  create: (userData) => API.post('/users', userData),
  update: (id, userData) => API.put(`/users/${id}`, userData),
  delete: (id) => API.delete(`/users/${id}`)
};

export const moodEntryService = {
  getAll: (userId) => API.get(`/mood-entries/user/${userId}`),
  getToday: (userId) => API.get(`/mood-entries/user/${userId}/today`),
  getRecent: (userId) => API.get(`/mood-entries/user/${userId}/recent`),
  getById: (id) => API.get(`/mood-entries/${id}`),
  create: (entryData) => API.post('/mood-entries', entryData),
  update: (id, entryData) => API.put(`/mood-entries/${id}`, entryData),
  delete: (id) => API.delete(`/mood-entries/${id}`),
  getComparison: (userId) => API.get(`/mood-entries/user/${userId}/comparison`)
};
