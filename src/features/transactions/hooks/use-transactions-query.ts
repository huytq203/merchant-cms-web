import { apiClient } from "@/lib/http/api-client";
import { useQuery } from "@tanstack/react-query";
import type { TransactionListResponse } from "../types";
import type { TransactionApiParams } from "../schemas";

interface GetTransactionsParams extends TransactionApiParams {
  page?: number;
  pageSize?: number;
}

export const useTransactionsQuery = (params: GetTransactionsParams = {}) => {
  const finalParams = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    ...params,
  };
  return useQuery<TransactionListResponse>({
    queryKey: ["transactions", finalParams],
    queryFn: () => apiClient.get<TransactionListResponse>("/v1/admin/merchants/transaction", { query: finalParams }),
    staleTime: 1000 * 60 * 1,
  });
};
