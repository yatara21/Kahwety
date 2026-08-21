import api from "@/lib/axios";
import type {
  Subscription,
  SubscriptionPlan,
  PaginatedResponse,
  SubscriberType,
  BillingCycle,
} from "@/types";

export const subscriptionsApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    user_id?: string;
  }) =>
    api.get<PaginatedResponse<Subscription>>("/admin/subscriptions", { params }),

  getById: (id: string) =>
    api.get<Subscription>(`/admin/subscriptions/${id}`),

  listPlans: (params?: {
    page?: number;
    page_size?: number;
    is_active?: boolean;
    subscriber_type?: SubscriberType;
    billing_cycle?: BillingCycle;
  }) =>
    api.get<PaginatedResponse<SubscriptionPlan>>("/admin/subscription-plans", {
      params,
    }),

  getPlan: (id: string) =>
    api.get<SubscriptionPlan>(`/admin/subscription-plans/${id}`),

  createPlan: (data: {
    name: string;
    description?: string | null;
    subscriber_type: SubscriberType;
    billing_cycle: BillingCycle;
    price: number;
    currency?: string;
    duration_days: number;
    is_active?: boolean;
  }) => api.post<SubscriptionPlan>("/admin/subscription-plans", data),

  updatePlan: (
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      subscriber_type: SubscriberType;
      billing_cycle: BillingCycle;
      price: number;
      currency: string;
      duration_days: number;
      is_active: boolean;
    }>
  ) => api.put<SubscriptionPlan>(`/admin/subscription-plans/${id}`, data),

  activatePlan: (id: string) =>
    api.patch<SubscriptionPlan>(`/admin/subscription-plans/${id}/activate`),

  deactivatePlan: (id: string) =>
    api.patch<SubscriptionPlan>(`/admin/subscription-plans/${id}/deactivate`),
};
