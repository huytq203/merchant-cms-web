import { apiClient } from "@/lib/http/api-client";
import { User, UserListResponse } from "../types/type";

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
  subMerchantScope: 'all' | 'specific';
  assignedSubMerchants: string[];
}

export const userApi = {
  getAll: (params: GetUserParams) => apiClient.get<UserListResponse>(BASE, { query: params }),
  create: (payload: CreateUserPayload) => apiClient.post<User>(BASE, payload),
}