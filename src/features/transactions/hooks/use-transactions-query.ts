import { apiClient } from "@/lib/http/api-client";
import { useQuery } from "@tanstack/react-query";
import type { TransactionListResponse } from "../types";

interface GetTransactionsParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  [key: string]: string | number | boolean | null | undefined
}
export const useTransactionsQuery = (params: GetTransactionsParams) => {
  return useQuery<TransactionListResponse>({
    queryKey: ["transactions", params],
    queryFn: () => apiClient.get<TransactionListResponse>("/v1/admin/merchants/transaction", { query: params }),
    staleTime: 1000 * 60 * 1,
  });
};
