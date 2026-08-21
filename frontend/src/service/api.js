import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export const register = (username, password) => api.post('/auth/register', { username, password });
export const login = (username, password) => api.post('/auth/login', { username, password });
export const getProfile = () => api.get('/users/profile');
export const getAllUsers = () => api.get('/users');
export const createMatch = (data) => api.post('/matches', data);
export const getMatchHistory = (userId) => api.get(`/matches/history/${userId || ''}`);
export const getHeroes = () => api.get('/heroes');
export const getExpRanking = () => api.get('/ranking/exp');
export const getHonorRanking = () => api.get('/ranking/honor');
export const checkIn = () => api.post('/quests/checkin');
export const getUserQuests = () => api.get('/quests');
export const adminCheckIn = (userId) => api.post(`/admin/checkin/${userId}`);


export default api;