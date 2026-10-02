import { apiClient } from "@/lib/http/api-client";
import type { Withdrawal, WithdrawalListResponse } from "../../features/withdrawals/types/types";

export interface GetWithdrawalListParams {
  [key: string]: string | number | undefined;
  keyword?: string;
  subMerchantId?: string;
  status?: string;
  createdFromDate?: string;
  createdToDate?: string;
  page?: number;
  pageSize?: number;
}

export const withdrawalApi = {
  getList: (params: GetWithdrawalListParams) =>
    apiClient.get<WithdrawalListResponse>("/v1/admin/merchants/withdrawals", {
      query: params,
    }),
  getById: (id: string) =>
    apiClient.get<Withdrawal>(`/v1/admin/merchants/withdrawals/${id}`),
};
