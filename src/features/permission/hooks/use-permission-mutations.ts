import { useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionApi, UpdatePermissionPayload, CreatePermissionPayload } from "../api/Permission.api";

export const useCreatePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePermissionPayload) =>
      permissionApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};

export const useUpdatePermission = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePermissionPayload) =>
      permissionApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};
