import { useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionApi, UpdatePermissionPayload } from "../api/Permission.api";

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
