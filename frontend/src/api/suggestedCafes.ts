import api from "@/lib/axios";
import type { SuggestedCafe, PaginatedResponse } from "@/types";

export const suggestedCafesApi = {
  list: (
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
      status?: string;
      city?: string;
    }
  ) => api.get<PaginatedResponse<SuggestedCafe>>("/suggested-cafes", { params }),
  getById: (id: string) => api.get<SuggestedCafe>(`/suggested-cafes/${id}`),
  create: (data: any) => api.post<SuggestedCafe>("/suggested-cafes", data),
  update: (id: string, data: any) =>
    api.put<SuggestedCafe>(`/suggested-cafes/${id}`, data),
  approve: (id: string) =>
    api.post<SuggestedCafe>(`/suggested-cafes/${id}/approve`),
  reject: (id: string) =>
    api.post<SuggestedCafe>(`/suggested-cafes/${id}/reject`),
  delete: (id: string) => api.delete(`/suggested-cafes/${id}`),
};