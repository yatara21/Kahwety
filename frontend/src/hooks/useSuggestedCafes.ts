import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { suggestedCafesApi } from "@/api/suggestedCafes";

export function useSuggestedCafes(
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
  }
) {
  return useQuery({
    queryKey: ["suggested-cafes", params],
    queryFn: () => suggestedCafesApi.list(params),
  });
}

export function useSuggestedCafe(id: string) {
  return useQuery({
    queryKey: ["suggested-cafe", id],
    queryFn: () => suggestedCafesApi.getById(id),
    enabled: !!id,
  });
}

export function useApproveSuggestedCafe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suggestedCafesApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suggested-cafes"] });
      qc.invalidateQueries({ queryKey: ["suggested-cafe"] });
    },
  });
}

export function useRejectSuggestedCafe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suggestedCafesApi.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suggested-cafes"] });
      qc.invalidateQueries({ queryKey: ["suggested-cafe"] });
    },
  });
}

export function useUpdateSuggestedCafe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      suggestedCafesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suggested-cafes"] });
      qc.invalidateQueries({ queryKey: ["suggested-cafe"] });
    },
  });
}

export function useDeleteSuggestedCafe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suggestedCafesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suggested-cafes"] });
    },
  });
}