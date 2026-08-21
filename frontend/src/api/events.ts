import api from "@/lib/axios";
import type { CafeEvent, PaginatedResponse } from "@/types";

export const eventsApi = {
  list: (
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
    }
  ) => api.get<PaginatedResponse<CafeEvent>>("/events", { params }),
  getById: (id: string) => api.get<CafeEvent>(`/events/${id}`),
  create: (data: any) => api.post<CafeEvent>("/events", data),
  update: (id: string, data: any) =>
    api.put<CafeEvent>(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
};
