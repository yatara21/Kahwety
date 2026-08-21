import api from "@/lib/axios";
import type { DashboardStats } from "@/types";

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>("/dashboard"),
};
