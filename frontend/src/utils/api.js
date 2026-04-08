import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  timeout: 15000,
});

//connt to the backend 
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error || error.message || "Something went wrong";
    console.error("API Error:", message);
    return Promise.reject(new Error(message));
  },
);

export default api;
