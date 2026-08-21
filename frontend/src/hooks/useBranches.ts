import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchesApi, type BranchPayload } from "@/api/branches";

export function useBranches(
  cafeId: string,
  params?: { page?: number; page_size?: number }
) {
  return useQuery({
    queryKey: ["branches", cafeId, params],
    queryFn: () => branchesApi.listByCafe(cafeId, params),
    enabled: !!cafeId,
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cafeId, data }: { cafeId: string; data: BranchPayload }) =>
      branchesApi.create(cafeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cafe"] });
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BranchPayload> }) =>
      branchesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cafe"] });
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => branchesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cafe"] });
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}