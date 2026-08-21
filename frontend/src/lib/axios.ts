import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${
            import.meta.env.VITE_API_BASE_URL ||
            "http://localhost:8000/api/v1"
          }/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const newAccessToken = data.data?.access_token || data.access_token;
        const newRefreshToken = data.data?.refresh_token || data.refresh_token;

        localStorage.setItem("access_token", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const apiClient = instance;

export const api = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    const response = await instance.get(url, { params });
    return response.data.data !== undefined ? response.data.data : response.data;
  },

  post: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await instance.post(url, data);
    return response.data.data !== undefined ? response.data.data : response.data;
  },

  put: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await instance.put(url, data);
    return response.data.data !== undefined ? response.data.data : response.data;
  },

  patch: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await instance.patch(url, data);
    return response.data.data !== undefined ? response.data.data : response.data;
  },

  delete: async <T>(url: string): Promise<T> => {
    const response = await instance.delete(url);
    return response.data.data !== undefined ? response.data.data : response.data;
  },
};

export default api;
