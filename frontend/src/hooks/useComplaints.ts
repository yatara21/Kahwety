import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintsApi } from "@/api/complaints";

export function useComplaints(
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
  }
) {
  return useQuery({
    queryKey: ["complaints", params],
    queryFn: () => complaintsApi.list(params),
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: ["complaint", id],
    queryFn: () => complaintsApi.getById(id),
    enabled: !!id,
  });
}

export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      complaintsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["complaints"] });
      qc.invalidateQueries({ queryKey: ["complaint"] });
    },
  });
}

export function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      complaintsApi.sendNotification(id, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["complaints"] });
      qc.invalidateQueries({ queryKey: ["complaint"] });
    },
  });
}

export function useTransferComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => complaintsApi.transfer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["complaints"] });
      qc.invalidateQueries({ queryKey: ["complaint"] });
    },
  });
}

export function useResolveComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => complaintsApi.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["complaints"] });
      qc.invalidateQueries({ queryKey: ["complaint"] });
    },
  });
}