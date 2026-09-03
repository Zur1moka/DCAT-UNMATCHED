// frontend/src/services/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: tự động gắn token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: xử lý lỗi 401 -> chuyển về login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== AUTH =====
export const register = (username, password, email) => 
  api.post('/auth/register', { username, password, email });
export const login = (username, password) => 
  api.post('/auth/login', { username, password });
export const verifyOTP = (email, otp) => 
  api.post('/auth/verify-otp', { email, otp });
export const resendOTP = (email) => 
  api.post('/auth/resend-otp', { email });
export const forgotPassword = (email) => 
  api.post('/auth/forgot-password', { email });
export const verifyResetToken = (token) => 
  api.get('/auth/verify-reset-token', { params: { token } });
export const resetPassword = (token, newPassword) => 
  api.post('/auth/reset-password', { token, newPassword });

// ===== USER =====
export const getProfile = () => api.get('/users/profile');
export const getAllUsers = () => api.get('/users');

// ===== MATCHES =====
export const createMatch = (data) => api.post('/matches', data);
export const getMatchHistory = (userId) => api.get(`/matches/history/${userId}`);
export const deleteMatch = (id) => api.delete(`/matches/${id}`);
export const getAllMatches = () => api.get('/matches');

// ===== HEROES =====
export const getHeroes = () => api.get('/heroes');
export const createHero = (data) => api.post('/heroes', data);
export const updateHero = (id, data) => api.put(`/heroes/${id}`, data);
export const deleteHero = (id) => api.delete(`/heroes/${id}`);

// ===== RANKING =====
export const getExpRanking = () => api.get('/ranking/exp');
export const getHonorRanking = () => api.get('/ranking/honor');

// ===== QUESTS =====
export const checkIn = () => api.post('/quests/checkin');
export const getUserQuests = () => api.get('/quests');
export const adminCheckIn = (userId) => api.post(`/admin/checkin/${userId}`);
export const getPendingQuests = () => api.get('/quests/pending');
export const approveQuest = (userQuestId, status, note = '') => 
  api.put(`/quests/approve/${userQuestId}`, { status, note });

// ===== REWARDS =====
export const getRewards = () => api.get('/rewards');
export const createReward = (data) => api.post('/rewards', data);
export const updateReward = (id, data) => api.put(`/rewards/${id}`, data);
export const deleteReward = (id) => api.delete(`/rewards/${id}`);

// ===== STATS =====
export const getOverviewStats = () => api.get('/stats/overview');
export const getDailyStats = (days = 7) => api.get('/stats/daily', { params: { days } });
export const getLevelDistribution = () => api.get('/stats/levels');

// ===== EXPORT CSV =====
export const exportUsers = () => api.get('/export/users', { responseType: 'blob' });
export const exportMatches = () => api.get('/export/matches', { responseType: 'blob' });
export const exportRanking = () => api.get('/export/ranking', { responseType: 'blob' });

// ===== EXPORT EXCEL =====
export const exportUsersExcel = () => api.get('/export/excel/users', { responseType: 'blob' });
export const exportMatchesExcel = () => api.get('/export/excel/matches', { responseType: 'blob' });
export const exportRankingExcel = () => api.get('/export/excel/ranking', { responseType: 'blob' });

// ===== ADMIN USER MANAGEMENT =====
export const adminGetAllUsers = () => api.get('/admin/users');
export const adminUpdateUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const adminResetPassword = (id, newPassword) => api.post(`/admin/users/${id}/reset-password`, { newPassword });
export const adminDeleteUser = (id) => api.delete(`/admin/users/${id}`);

export default api;