import api from "@/lib/axios";
import type { Branch, PaginatedResponse } from "@/types";

export interface BranchPayload {
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
  working_hours?: Record<string, string> | null;
}

export const branchesApi = {
  listByCafe: (
    cafeId: string,
    params?: { page?: number; page_size?: number }
  ) =>
    api.get<PaginatedResponse<Branch>>(`/branches/cafe/${cafeId}`, { params }),
  getById: (id: string) => api.get<Branch>(`/branches/${id}`),
  create: (cafeId: string, data: BranchPayload) =>
    api.post<Branch>("/branches", { ...data, cafe_id: cafeId }),
  update: (id: string, data: Partial<BranchPayload>) =>
    api.put<Branch>(`/branches/${id}`, data),
  delete: (id: string) => api.delete(`/branches/${id}`),
};