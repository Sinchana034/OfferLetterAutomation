import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL: BASE_URL });

// Attaches whichever token is currently active - staff or candidate.
// Only one should be present at a time (login flows clear the other).
api.interceptors.request.use((config) => {
  const staffToken = localStorage.getItem('staff_token');
  const candidateToken = localStorage.getItem('candidate_token');
  const token = staffToken || candidateToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalizes API errors into a readable message string.
export const getErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
