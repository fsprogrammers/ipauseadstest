// import axios from "axios";

// const api = axios.create({
//   baseURL: "/api", // Proxy all requests to Netlify redirects
//   headers: { "Content-Type": "application/json" },
// });

// api.interceptors.request.use((cfg) => {
//   const token = localStorage.getItem("token");
//   if (token) cfg.headers.Authorization = `Bearer ${token}`;
//   return cfg;
// });

// export default api;




import axios from "axios";

// Use the backend URL from env or fallback to localhost
const API_URL = import.meta.env.VITE_API_BASE_URL || "https://api.ipauseads.com";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;


