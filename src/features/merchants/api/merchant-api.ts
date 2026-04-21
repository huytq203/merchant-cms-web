import { apiClient } from '@/lib/http/api-client';
import type {
  ApproveMerchantPayload,
  CreateMerchantPayload,
  LockMerchantPayload,
  Merchant,
  MerchantListFilter,
  MerchantListResponse,
  RejectMerchantPayload,
} from '../types';

const BASE = '/v1/admin/merchants';

function buildParams(filter: MerchantListFilter): Record<string, string | number | boolean | undefined | null> {
  return {
    keyword: filter.keyword || undefined,
    businessType: filter.businessType || undefined,
    status: filter.status || undefined,
    salesStaffId: filter.salesStaffId || undefined,
    registeredFrom: filter.registeredFrom?.toISOString(),
    registeredTo: filter.registeredTo?.toISOString(),
    activatedFrom: filter.activatedFrom?.toISOString(),
    activatedTo: filter.activatedTo?.toISOString(),
    page: filter.page,
    pageSize: filter.pageSize,
  };
}

export const merchantApi = {
  list: (filter: MerchantListFilter): Promise<MerchantListResponse> =>
    apiClient.get<MerchantListResponse>(BASE, { query: buildParams(filter) }),

  getById: (id: string): Promise<Merchant> =>
    apiClient.get<Merchant>(`${BASE}/${id}`),

  create: (payload: CreateMerchantPayload): Promise<Merchant> =>
    apiClient.post<Merchant>(BASE, payload),

  update: (id: string, payload: Partial<CreateMerchantPayload>): Promise<Merchant> =>
    apiClient.patch<Merchant>(`${BASE}/${id}`, payload),

  approve: (payload: ApproveMerchantPayload): Promise<Merchant> =>
    apiClient.post<Merchant>(`${BASE}/${payload.merchantId}/approve`),

  reject: (payload: RejectMerchantPayload): Promise<Merchant> =>
    apiClient.post<Merchant>(`${BASE}/${payload.merchantId}/reject`, {
      reason: payload.reason,
      note: payload.note,
    }),

  lock: (payload: LockMerchantPayload): Promise<Merchant> =>
    apiClient.post<Merchant>(`${BASE}/${payload.merchantId}/lock`, {
      reason: payload.reason,
    }),

  unlock: (payload: LockMerchantPayload): Promise<Merchant> =>
    apiClient.post<Merchant>(`${BASE}/${payload.merchantId}/unlock`, {
      reason: payload.reason,
    }),
};
