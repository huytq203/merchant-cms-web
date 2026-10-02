const BASE = "/v1/admin/merchants/sub-merchants";
import { apiClient } from "@/lib/http/api-client";
import {
  SubMerchant,
  SubMerchantListFilter,
  SubMerchantListResponse,
} from "../../features/sub-merchants/types";
import {
  NewSubMerchantFormValues,
  SubMerchantFormValues,
} from "../../features/sub-merchants/schemas";

export const subMerchantApi = {
  getAll: (params: SubMerchantListFilter) =>
    apiClient.get<SubMerchantListResponse>(BASE, { query: params }),
  getById: (id: string) => apiClient.get<SubMerchant>(`${BASE}/${id}`),
  postCreate: (data: SubMerchantFormValues) =>
    apiClient.post<SubMerchant>(BASE, data),
  putUpdate: (id: string, data: SubMerchantFormValues) =>
    apiClient.put<SubMerchant>(`${BASE}/${id}`, data),
  postCreateFull: (
    data: NewSubMerchantFormValues & {
      merchantId: string;
      accessKey: string;
      secretKey: string;
    },
  ) => apiClient.post<SubMerchant>(BASE, data),
  putUpdateFull: (
    id: string,
    data: NewSubMerchantFormValues & {
      merchantId: string;
      accessKey: string;
      secretKey: string;
    },
  ) => apiClient.put<SubMerchant>(`${BASE}/${id}`, data),
  toggleStatus: (
    id: string,
    payload: { lockReason: string | null; lockedAt: string | null },
  ) => apiClient.patch<SubMerchant>(`${BASE}/${id}`, payload),
};
