import axios from "axios";

const api = axios.create({
  baseURL: "https://api.semaki.my.id/api",
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.token) {
        config.headers["Authorization"] = `Bearer ${user.token}`;
      }
      if (user?.sessionToken) {
        config.headers["x-session-token"] = user.sessionToken;
      }
    }
  } catch {
    // skip
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      err.response?.data?.code === "SESSION_INVALIDATED"
    ) {
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  },
);

export default api;
