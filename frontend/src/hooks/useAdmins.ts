import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminsApi } from "@/api/admins";

export function useAdmins(
  params?: { page?: number; page_size?: number; search?: string }
) {
  return useQuery({
    queryKey: ["admins", params],
    queryFn: () => adminsApi.list(params),
  });
}

export function useAdmin(id: string) {
  return useQuery({
    queryKey: ["admin", id],
    queryFn: () => adminsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admins"] });
    },
  });
}

export function useUpdateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admins"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useAdminPermissions(id: string) {
  return useQuery({
    queryKey: ["admin-permissions", id],
    queryFn: () => adminsApi.getPermissions(id),
    enabled: !!id,
  });
}

export function useUpdateAdminPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      permissions,
    }: {
      id: string;
      permissions: string[];
    }) => adminsApi.updatePermissions(id, permissions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-permissions"] });
      qc.invalidateQueries({ queryKey: ["admins"] });
    },
  });
}
