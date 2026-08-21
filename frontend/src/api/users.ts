import api from "@/lib/axios";
import type { User, PaginatedResponse } from "@/types";

export const usersApi = {
  list: (
    params?: {
      page?: number;
      page_size?: number;
      status?: string;
      search?: string;
      role?: string;
    }
  ) => api.get<PaginatedResponse<User>>("/users", { params }),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: any) => api.post<User>("/users", data),
  update: (id: string, data: any) => api.put<User>(`/users/${id}`, data),
};
