import { useQuery } from "@tanstack/react-query";
import { permissionApi } from "@/lib/api/Permission.api";

export const usePermissions = () => {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionApi.getAll({ pageSize: 100 }),
    staleTime: 1000 * 60 * 5,
  });
};
