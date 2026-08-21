import api from "@/lib/axios";
import type { Complaint, PaginatedResponse } from "@/types";

export const complaintsApi = {
  list: (
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
      status?: string;
    }
  ) => api.get<PaginatedResponse<Complaint>>("/complaints", { params }),
  getById: (id: string) => api.get<Complaint>(`/complaints/${id}`),
  update: (id: string, data: any) =>
    api.put<Complaint>(`/complaints/${id}`, data),
  sendNotification: (id: string, message: string) =>
    api.post<Complaint>(`/complaints/${id}/send-notification`, { message }),
  transfer: (id: string) =>
    api.post<Complaint>(`/complaints/${id}/transfer`),
  resolve: (id: string) =>
    api.post<Complaint>(`/complaints/${id}/resolve`),
  cafeReply: (id: string, reply: string) =>
    api.post<Complaint>(`/complaints/${id}/cafe-reply`, { reply }),
};