import api from "@/lib/axios";
import type { Coupon, PaginatedResponse } from "@/types";

export const couponsApi = {
  list: (params?: { page?: number; page_size?: number; is_active?: boolean }) =>
    api.get<PaginatedResponse<Coupon>>("/coupons", { params }),
  getById: (id: string) =>
    api.get<Coupon>(`/coupons/${id}`),
  create: (data: any) =>
    api.post<Coupon>("/coupons", data),
  update: (id: string, data: any) =>
    api.put<Coupon>(`/coupons/${id}`, data),
  terminate: (id: string) =>
    api.post<Coupon>(`/coupons/${id}/terminate`),
  delete: (id: string) =>
    api.delete(`/coupons/${id}`),
};
