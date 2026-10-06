import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import type {
  Withdrawal,
  WithdrawalBankOptions,
  WithdrawalListFilter,
  WithdrawalListResult,
} from "./types/types";

export const WITHDRAWALS_ENDPOINT = "/v1/admin/withdrawals";

type RawSearchParams = Record<string, string | string[] | undefined>;

function numberParam(value: string | string[] | undefined, fallback: number, max = Infinity): number {
  const parsed = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
}

export function parseWithdrawalSearchParams(raw: RawSearchParams): WithdrawalListFilter {
  // The BE search takes no filter, so transactionCode/status/date in the URL are intentionally ignored.
  return {
    page: numberParam(raw.page, 1),
    pageSize: numberParam(raw.pageSize, 10, 100),
  };
}

export function toWithdrawalSearchParams(filter: WithdrawalListFilter): URLSearchParams {
  return new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
}

export const withdrawalQueries = {
  list: (filter: WithdrawalListFilter) => {
    const pagination = { page: filter.page, pageSize: filter.pageSize };
    return queryOptions({
      queryKey: ["withdrawals", "list", pagination] as const,
      queryFn: () => apiClient.get<WithdrawalListResult>(WITHDRAWALS_ENDPOINT, {
        query: Object.fromEntries(toWithdrawalSearchParams(pagination)),
      }),
    });
  },
  detail: (id: string) => queryOptions({
    queryKey: ["withdrawals", "detail", id] as const,
    queryFn: () => apiClient.get<Withdrawal>(`${WITHDRAWALS_ENDPOINT}/${encodeURIComponent(id)}`),
  }),
  bankOptions: (subMerchantId = "") => queryOptions({
    queryKey: ["withdrawals", "bank-options", subMerchantId] as const,
    queryFn: () => apiClient.get<WithdrawalBankOptions>(`${WITHDRAWALS_ENDPOINT}/bank-options`, {
      query: { subMerchantId: subMerchantId || undefined },
    }),
  }),
};
