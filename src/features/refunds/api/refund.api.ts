import { apiClient } from '@/lib/http/api-client';
import type { RefundListResponse } from '../types';

export interface GetRefundListParams {
  [key: string]: string | number | undefined;
  keyword?: string;
  invoiceCode?: string;
  subMerchantId?: string;
  status?: string;
  createdFromDate?: string;
  createdToDate?: string;
  page?: number;
  pageSize?: number;
}

export const refundApi = {
  getList: (params: GetRefundListParams) =>
    apiClient.get<RefundListResponse>('/v1/admin/merchants/refunds', { query: params }),
};
