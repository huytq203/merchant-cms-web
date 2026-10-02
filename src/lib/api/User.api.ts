import { apiClient } from "@/lib/http/api-client";
import { User, UserListResponse } from "../../features/users/types/type";

const BASE = "/v1/admin/merchants/users";

interface GetUserParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface CreateUserPayload {
  name: string;
  email: string;
  phone: string;
  permissionGroupId: string;
  subMerchantScope: "all" | "specific";
  assignedSubMerchantsIds: string[];
}

export const userApi = {
  getAll: (params: GetUserParams) =>
    apiClient.get<UserListResponse>(BASE, { query: params }),
  getById: (id: string) => apiClient.get<User>(`${BASE}/${id}`),
  create: (payload: CreateUserPayload) => apiClient.post<User>(BASE, payload),
  update: (id: string, payload: CreateUserPayload) =>
    apiClient.put<User>(`${BASE}/${id}`, payload),
  changeStatus: (id: string, status: string) =>
    apiClient.patch<User>(`${BASE}/${id}`, { status }),
  lockUser: (id: string, lockReason: string) =>
    apiClient.patch<User>(`${BASE}/${id}`, { lockReason, lockedAt: new Date().toISOString() }),
  unlockUser: (id: string) =>
    apiClient.patch<User>(`${BASE}/${id}`, { lockReason: "", lockedAt: null }),
};
