import api from "@/lib/axios";
import type { AuthTokens, LoginRequest, GoogleLoginRequest } from "@/types";

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthTokens>("/auth/login", data),
  googleLogin: (data: GoogleLoginRequest) =>
    api.post<AuthTokens>("/auth/google", data),
  getMe: () => api.get("/auth/me"),
  refresh: (refreshToken: string) =>
    api.post<AuthTokens>("/auth/refresh", { refresh_token: refreshToken }),
  logout: (refreshToken: string) =>
    api.post("/auth/logout", { refresh_token: refreshToken }),
  sendOtp: (phone: string) => api.post("/auth/send-otp", { phone }),
  verifyOtp: (phone: string, code: string) =>
    api.post("/auth/verify-otp", { phone, code }),
};
