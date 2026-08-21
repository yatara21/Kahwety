import api from "@/lib/axios";
import type { User, PaginatedResponse, PagePermissionEntry } from "@/types";

export const adminsApi = {
  list: (params?: { page?: number; page_size?: number; search?: string }) =>
    api.get<PaginatedResponse<User>>("/admins", { params }),
  getById: (id: string) => api.get<User>(`/admins/${id}`),
  create: (data: any) => api.post<User>("/admins", data),
  update: (id: string, data: any) => api.put<User>(`/admins/${id}`, data),
  getPermissions: (id: string) =>
    api.get<PagePermissionEntry[]>(`/admins/${id}/permissions`),
  updatePermissions: (id: string, permissions: string[]) =>
    api.put(`/admins/${id}/permissions`, { pages: permissions }),
};
