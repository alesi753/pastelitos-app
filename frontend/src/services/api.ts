import axios from 'axios';                                   // Importo axios para realizar peticiones HTTP

const api = axios.create({
  baseURL: 'http://localhost:3000/api',                    
  headers: {
    'Content-Type': 'application/json',                     // Defino que el formato de envío es JSON
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('adminToken');
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

export default api;                                        