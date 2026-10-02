import { apiClient } from "@/lib/http/api-client";
import type { RefundListResponse } from "../../features/refund/types/type";

export interface GetRefundListParams {
  keyword?: string;
  invoiceCode?: string;
  subMerchantId?: string;
  status?: string;
  createdFromDate?: string;
  createdToDate?: string;
  page?: number;
  pageSize?: number;
  [key: string]: string | number | undefined;
}

export const refundApi = {
  getList: (params: GetRefundListParams) =>
    apiClient.get<RefundListResponse>("/v1/admin/merchants/refunds", {
      query: params,
    }),
};
