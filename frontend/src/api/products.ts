import api from "@/lib/axios";
import type { Product, PaginatedResponse } from "@/types";

export const productsApi = {
  list: (
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
    }
  ) => api.get<PaginatedResponse<Product>>("/products", { params }),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: any) => api.post<Product>("/products", data),
  update: (id: string, data: any) =>
    api.put<Product>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};
