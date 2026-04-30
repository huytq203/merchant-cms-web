import { apiClient } from "@/lib/http/api-client";
import type { OrderListResponse } from "../../features/orders/types/types";

export interface GetOrderListParams {
  [key: string]: string | number | undefined;
  keyword?: string;
  source?: string;
  subMerchantId?: string;
  createdBy?: string;
  status?: string;
  createdFromDate?: string;
  createdToDate?: string;
  page?: number;
  pageSize?: number;
}

export const orderApi = {
  getList: (params: GetOrderListParams) =>
    apiClient.get<OrderListResponse>("/v1/admin/merchants/orders", {
      query: params,
    }),
};
