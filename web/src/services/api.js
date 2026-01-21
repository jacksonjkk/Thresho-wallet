import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for dev
const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4001', 
  withCredentials: false 
});

API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('jwt');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default API;
