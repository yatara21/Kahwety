import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionsApi } from "@/api/subscriptions";
import type { BillingCycle, SubscriberType } from "@/types";

export function useSubscriptions(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  user_id?: string;
}) {
  return useQuery({
    queryKey: ["subscriptions", params],
    queryFn: () => subscriptionsApi.list(params),
  });
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: ["subscription", id],
    queryFn: () => subscriptionsApi.getById(id),
    enabled: !!id,
  });
}

export function useSubscriptionPlans(params?: {
  page?: number;
  page_size?: number;
  is_active?: boolean;
  subscriber_type?: SubscriberType;
  billing_cycle?: BillingCycle;
}) {
  return useQuery({
    queryKey: ["subscription-plans", params],
    queryFn: () => subscriptionsApi.listPlans(params),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionsApi.createPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof subscriptionsApi.updatePlan>[1] }) =>
      subscriptionsApi.updatePlan(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
}

export function useActivatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionsApi.activatePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
}

export function useDeactivatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionsApi.deactivatePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
}
