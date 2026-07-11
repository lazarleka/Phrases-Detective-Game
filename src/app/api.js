const WEB_API_URL = 'http://localhost:8081/api';
const NATIVE_API_URL = 'http://192.168.1.105:8081/api';
const TOKEN_KEY = 'phrases_detective_token';

function isProbablyNativeApp() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
}

function getApiUrl() {
  if (isProbablyNativeApp()) {
    return import.meta.env.VITE_NATIVE_API_URL || NATIVE_API_URL;
  }
  return import.meta.env.VITE_API_URL || WEB_API_URL;
}

export function getApiBaseUrl() {
  return getApiUrl();
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const apiUrl = getApiUrl();

  if (isProbablyNativeApp() && apiUrl.includes('localhost')) {
    throw new Error('Aplikacija na telefonu nema podesenu adresu backend-a.');
  }

  const token = getToken();
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Backend nije dostupan.');
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/me'),
  leaderboard: () => request('/leaderboard?limit=50'),
  achievements: () => request('/achievements'),
  dailyChallenge: () => request('/daily-challenge'),
  questions: (difficulty) => request(`/questions?difficulty=${encodeURIComponent(difficulty)}`),
  searchUsers: (query) => request(`/users/search?q=${encodeURIComponent(query)}`),
  friends: () => request('/friends'),
  sendFriendRequest: (username) => request('/friends/requests', { method: 'POST', body: JSON.stringify({ username }) }),
  acceptFriendRequest: (id) => request(`/friends/requests/${id}/accept`, { method: 'POST' }),
  rejectFriendRequest: (id) => request(`/friends/requests/${id}/reject`, { method: 'POST' }),
  matches: () => request('/matches'),
  match: (id) => request(`/matches/${id}`),
  createMatch: (opponentUsername, difficulty) => request('/matches', { method: 'POST', body: JSON.stringify({ opponentUsername, difficulty }) }),
  acceptMatch: (id) => request(`/matches/${id}/accept`, { method: 'POST' }),
  rejectMatch: (id) => request(`/matches/${id}/reject`, { method: 'POST' }),
  saveMatchQuestions: (id, questions) => request(`/matches/${id}/questions`, { method: 'PUT', body: JSON.stringify({ questionsJson: JSON.stringify(questions) }) }),
  submitMatchAnswer: (id, answer) => request(`/matches/${id}/answers`, { method: 'POST', body: JSON.stringify(answer) }),
  submitMatchScore: (id, result) => request(`/matches/${id}/score`, { method: 'POST', body: JSON.stringify(result) }),
  forfeitMatch: (id) => request(`/matches/${id}/forfeit`, { method: 'POST' }),
  registerPushToken: (token, platform = 'android') => request('/push/tokens', { method: 'POST', body: JSON.stringify({ token, platform }) }),
  testPush: () => request('/push/test', { method: 'POST' }),
  saveGame: (body) => request('/progress/games', { method: 'POST', body: JSON.stringify(body) }),
  adminPhrases: (query = '') => request(`/admin/phrases?q=${encodeURIComponent(query)}`),
  createPhrase: (body) => request('/admin/phrases', { method: 'POST', body: JSON.stringify(body) }),
  updatePhrase: (id, body) => request(`/admin/phrases/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePhrase: (id) => request(`/admin/phrases/${id}`, { method: 'DELETE' }),
};
