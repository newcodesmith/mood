import axios from 'axios';

const LOCAL_API_BASE_URL = 'http://localhost:3001/api';
const PROD_FALLBACK_API_BASE_URL = '/api';

const isLocalDevHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (isLocalDevHost ? LOCAL_API_BASE_URL : PROD_FALLBACK_API_BASE_URL);

if (!process.env.REACT_APP_API_URL && !isLocalDevHost) {
  console.warn(
    'REACT_APP_API_URL is not set. Using /api fallback. Set REACT_APP_API_URL for production deployments.'
  );
}

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
  changePassword: (payload) => API.post('/auth/change-password', payload),
  forgotPassword: (payload) => API.post('/auth/forgot-password', payload),
  resetPassword: (payload) => API.post('/auth/reset-password', payload)
};

export const userService = {
  getAll: () => API.get('/users'),
  getById: (id) => API.get(`/users/${id}`),
  create: (userData) => API.post('/users', userData),
  update: (id, userData) => API.put(`/users/${id}`, userData),
  updatePreferences: (id, preferences) => API.patch(`/users/${id}/preferences`, preferences),
  getBreathingProfiles: (id) => API.get(`/users/${id}/breathing-profiles`),
  createBreathingProfile: (id, profileData) => API.post(`/users/${id}/breathing-profiles`, profileData),
  updateBreathingProfile: (id, profileId, profileData) => API.patch(`/users/${id}/breathing-profiles/${profileId}`, profileData),
  deleteBreathingProfile: (id, profileId) => API.delete(`/users/${id}/breathing-profiles/${profileId}`),
  delete: (id) => API.delete(`/users/${id}`)
};

export const moodEntryService = {
  getAll: (userId) => API.get(`/mood-entries/user/${userId}`),
  getToday: (userId, date) =>
    API.get(`/mood-entries/user/${userId}/today`, {
      params: date ? { date } : undefined
    }),
  getByDate: (userId, date) =>
    API.get(`/mood-entries/user/${userId}/by-date`, {
      params: { date }
    }),
  getRecent: (userId) => API.get(`/mood-entries/user/${userId}/recent`),
  getById: (id) => API.get(`/mood-entries/${id}`),
  create: (entryData) => API.post('/mood-entries', entryData),
  update: (id, entryData) => API.put(`/mood-entries/${id}`, entryData),
  delete: (id) => API.delete(`/mood-entries/${id}`),
  getComparison: (userId) => API.get(`/mood-entries/user/${userId}/comparison`)
};
