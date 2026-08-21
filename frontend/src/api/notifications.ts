import api from "@/lib/axios";
import type { Notification, PaginatedResponse } from "@/types";

export const notificationsApi = {
  list: (params?: { page?: number; page_size?: number }) =>
    api.get<PaginatedResponse<Notification>>("/notifications", { params }),
  getById: (id: string) =>
    api.get<Notification>(`/notifications/${id}`),
  create: (data: any) =>
    api.post<Notification>("/notifications", data),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};
