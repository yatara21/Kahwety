import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cafesApi, type CafePayload } from "@/api/cafes";

export function useCafes(
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
    registration_status?: string;
  }
) {
  return useQuery({
    queryKey: ["cafes", params],
    queryFn: () => cafesApi.list(params),
  });
}

export function useCafe(id: string) {
  return useQuery({
    queryKey: ["cafe", id],
    queryFn: () => cafesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCafe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CafePayload) => cafesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cafes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateCafe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CafePayload> }) =>
      cafesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cafes"] });
      qc.invalidateQueries({ queryKey: ["cafe"] });
    },
  });
}

export function useApproveCafe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cafesApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cafes"] });
      qc.invalidateQueries({ queryKey: ["cafe"] });
    },
  });
}

export function useRejectCafe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cafesApi.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cafes"] });
      qc.invalidateQueries({ queryKey: ["cafe"] });
    },
  });
}