import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offersApi } from "@/api/offers";

export function useOffers(
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }
) {
  return useQuery({
    queryKey: ["offers", params],
    queryFn: () => offersApi.list(params),
  });
}

export function useOffer(id: string) {
  return useQuery({
    queryKey: ["offer", id],
    queryFn: () => offersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: offersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      offersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["offer"] });
    },
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => offersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}
