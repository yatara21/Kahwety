import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { couponsApi } from "@/api/coupons";

export function useCoupons(params?: { page?: number; page_size?: number; is_active?: boolean }) {
  return useQuery({
    queryKey: ["coupons", params],
    queryFn: () => couponsApi.list(params),
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: couponsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coupons"] }); },
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => couponsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coupons"] }); },
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => couponsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coupons"] }); },
  });
}
