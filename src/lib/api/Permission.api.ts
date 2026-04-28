import { apiClient } from "@/lib/http/api-client";
import {
  PermissionAPI,
  PermissionData,
} from "../../features/permission/types/type";

const BASE = "/v1/admin/permissions";

export interface ParamsGetAll {
  page?: number;
  pageSize?: number;
  keyword?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface UpdatePermissionPayload {
  name: string;
  status: "active" | "inactive";
  permissions: string[];
}

export interface CreatePermissionPayload {
  name: string;
  permissions: string[];
}

export const permissionApi = {
  getAll: <T = string>(params: ParamsGetAll) =>
    apiClient.get<PermissionAPI<T>>(BASE, { query: params }),
  getById: (id: string) => apiClient.get<PermissionData>(`${BASE}/${id}`),
  create: (payload: CreatePermissionPayload) =>
    apiClient.post<PermissionData>(BASE, payload),
  update: (id: string, payload: UpdatePermissionPayload) =>
    apiClient.put<PermissionData>(`${BASE}/${id}`, payload),
};
