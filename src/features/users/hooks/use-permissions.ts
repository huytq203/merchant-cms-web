import { useQuery } from "@tanstack/react-query";
import { permissionApi } from "@/lib/api/Permission.api";
import { Permission } from "@/features/permission/types/type";

export const usePermissions = () => {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionApi.getAll<Permission>({ pageSize: 100 }),
    staleTime: 1000 * 60 * 5,
  });
};
