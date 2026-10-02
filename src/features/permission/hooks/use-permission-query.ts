import { useQuery } from "@tanstack/react-query";
import { ParamsGetAll, permissionApi } from "../../../lib/api/Permission.api";
import { PermissionAPI, PermissionData } from "../types/type";

export const usePermissionQuery = (params: ParamsGetAll) => {
  return useQuery<PermissionAPI>({
    queryKey: ["permissions", params],
    queryFn: () => permissionApi.getAll(params),
    staleTime: 1000 * 60 * 1,
  });
};

export const usePermissionDetailQuery = (id: string) => {
  return useQuery<PermissionData>({
    queryKey: ["permissions", id],
    queryFn: () => permissionApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 1,
  });
};
