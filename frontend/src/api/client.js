import axios from 'axios';

// Create a basic Axios client
export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optionally, add interceptors for auth tokens here if needed
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
