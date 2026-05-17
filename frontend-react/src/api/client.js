import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Adjunta el token JWT automáticamente si existe
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejo de respuestas
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en response interceptor:', error);
    return Promise.reject(error);
  }
);

export default client;