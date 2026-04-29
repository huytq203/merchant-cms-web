import { apiClient } from "@/lib/http/api-client";
import type { TransactionApiParams } from "../schemas";

interface GetTransactionListParams extends TransactionApiParams {
  page?: number;
  pageSize?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export const transactionApi = {
  getList: (params: GetTransactionListParams) => apiClient.get("/v1/admin/merchants/transaction", { query: params }),
};