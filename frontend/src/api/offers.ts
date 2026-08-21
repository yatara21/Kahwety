import api from "@/lib/axios";
import type { Offer, PaginatedResponse } from "@/types";

export const offersApi = {
  list: (
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
    }
  ) => api.get<PaginatedResponse<Offer>>("/offers", { params }),
  getById: (id: string) => api.get<Offer>(`/offers/${id}`),
  create: (data: any) => api.post<Offer>("/offers", data),
  update: (id: string, data: any) =>
    api.put<Offer>(`/offers/${id}`, data),
  delete: (id: string) => api.delete(`/offers/${id}`),
};
