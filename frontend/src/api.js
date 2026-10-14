import axios from 'axios';

// Project-specific name so a global REACT_APP_API_URL from another project can't override it
export const API_URL = process.env.REACT_APP_BRUHCODE_API_URL || 'http://localhost:5163';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cp_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('cp_token');
      localStorage.removeItem('cp_user');
      // If we're not already on the login/register paths, redirect to login
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Contest API endpoints
export const contestAPI = {
  getAll: () => api.get('/api/contests'),
  getById: (id) => api.get(`/api/contests/${id}`),
};

export const authAPI = {
  login: (payload) => api.post('/api/auth/login', payload),
  register: (payload) => api.post('/api/auth/register', payload),
  validateUsername: (username) => api.post('/api/auth/validate-username', { value: username }),
  validateEmail: (email) => api.post('/api/auth/validate-email', { value: email }),
  validateCodeforces: (handle) => api.post('/api/auth/validate-codeforces', { value: handle }),
  requestPasswordReset: (payload) => api.post('/api/auth/request-password-reset', payload),
  verifyResetOtp: (payload) => api.post('/api/auth/verify-reset-otp', payload),
  resetPassword: (payload) => api.post('/api/auth/reset-password', payload),
};

export const userAPI = {
  getSavedContests: () => api.get('/api/user/saved-contests'),
  addContest: (contestId, status = 'Interested') => api.post('/api/user/add-contest', { contestId, status }),
  removeContest: (contestId) => api.delete(`/api/user/saved-contests/${contestId}`),
  updateProfile: (payload) => api.put('/api/user/profile', payload),
  changePassword: (payload) => api.put('/api/user/change-password', payload),
  getProfile: () => api.get('/api/user/profile'),
};

export const statsAPI = {
  get: () => api.get('/api/stats'),
};

export const contactAPI = {
  submit: (payload) => api.post('/api/contact', payload),
};


// ─── Practice Rooms API ──────────────────────────────────────────
export const roomAPI = {
  // Room CRUD
  create: (payload) => api.post('/api/rooms', payload),
  getAll: () => api.get('/api/rooms'),
  getById: (id) => api.get(`/api/rooms/${id}`),

  // Join
  joinByCode: (inviteCode) => api.post('/api/rooms/join', { inviteCode }),

  // Progress
  updateProgress: (id, roomProblemId, status) =>
    api.put(`/api/rooms/${id}/progress`, { roomProblemId, status }),

  // Leaderboard
  getLeaderboard: (id) => api.get(`/api/rooms/${id}/leaderboard`),

  // Messages
  getMessages: (id, problemId) =>
    api.get(`/api/rooms/${id}/messages/${problemId}`),
  postMessage: (id, payload) => api.post(`/api/rooms/${id}/messages`, payload),

  // Summary
  getSummary: (id) => api.get(`/api/rooms/${id}/summary`),
};

// ─── Brain Gym API ───────────────────────────────────────────────
export const brainGymAPI = {
  getGamesList: () =>
    api.get('/api/games'),
  getQuestions: (gameKey, difficulty = 'Mixed', count = 10) =>
    api.get(`/api/games/${gameKey}/questions?difficulty=${difficulty}&count=${count}`),
  submitScore: (gameKey, payload) =>
    api.post(`/api/games/${gameKey}/submit-score`, payload),
  getLeaderboard: (gameKey, top = 20) =>
    api.get(`/api/games/${gameKey}/leaderboard?top=${top}`),
  getOverview: () =>
    api.get('/api/games/overview'),
  getMyRank: (gameKey) =>
    api.get(`/api/games/${gameKey}/my-rank`),
};

export default api;
