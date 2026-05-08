import axios from 'axios';

// Axios client using Django session auth (cookie-based)
export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/',
  withCredentials: true,  // include session cookie on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Read CSRF token from Django's csrftoken cookie and attach it to every
// mutating request — required by Django's CsrfViewMiddleware
function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

apiClient.interceptors.request.use((config) => {
  const method = (config.method || '').toLowerCase();
  if (!['get', 'head', 'options', 'trace'].includes(method)) {
    config.headers['X-CSRFToken'] = getCsrfToken();
  }
  return config;
});

export default apiClient;
