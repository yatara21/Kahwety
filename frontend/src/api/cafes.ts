import api from "@/lib/axios";
import type { Cafe, PaginatedResponse } from "@/types";

export interface CafePayload {
  name: string;
  description: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
  working_hours?: Record<string, string> | null;
}

export const cafesApi = {
  list: (
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
      registration_status?: string;
    }
  ) => api.get<PaginatedResponse<Cafe>>("/cafes", { params }),
  getById: (id: string) => api.get<Cafe>(`/cafes/${id}`),
  create: (data: CafePayload) => api.post<Cafe>("/cafes", data),
  update: (id: string, data: Partial<CafePayload>) =>
    api.put<Cafe>(`/cafes/${id}`, data),
  approve: (id: string) => api.post(`/cafes/${id}/approve`),
  reject: (id: string) => api.post(`/cafes/${id}/reject`),
};