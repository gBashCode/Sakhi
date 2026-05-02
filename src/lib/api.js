import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Auto-attach token
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('sakhi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const askCopilot = async (message) => {
  try {
    const res = await api.post('/api/v1/copilot/chat', { message });
    return res.data.reply;
  } catch (error) {
    console.error('Copilot API error:', error);
    return 'Sorry, I am offline right now. Please try again later.';
  }
};
