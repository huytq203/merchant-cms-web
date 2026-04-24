import { apiClient } from "@/lib/http/api-client";
import { PermissionAPI, PermissionData } from "../types/type";

const BASE = '/v1/admin/permissions';

export interface ParamsGetAll {
  page?: number
  pageSize?: number
  keyword?: string
  [key: string]: string | number | boolean | null | undefined
}

export interface UpdatePermissionPayload {
  name: string
  status: boolean
  permissions: string[]
}

export const permissionApi = {
  getAll: (params: ParamsGetAll) =>
    apiClient.get<PermissionAPI>(BASE, { query: params }),
  getById: (id: string) =>
    apiClient.get<PermissionData>(`${BASE}/${id}`),
  update: (id: string, payload: UpdatePermissionPayload) =>
    apiClient.patch<PermissionData>(`${BASE}/${id}`, payload),
}