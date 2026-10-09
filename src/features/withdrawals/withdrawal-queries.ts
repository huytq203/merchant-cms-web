import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient } from "@/lib/http/api-client";
import { withdrawalStatusGroupSchema } from "./schemas/withdrawal.schema";
import type {
  Withdrawal,
  WithdrawalBalance,
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

const dayParam = z.iso.date();

export function parseWithdrawalSearchParams(raw: RawSearchParams): WithdrawalListFilter {
  const transactionCode = typeof raw.transactionCode === "string" ? raw.transactionCode.trim().slice(0, 100) : "";
  const group = withdrawalStatusGroupSchema.safeParse(raw.status);
  const createdFrom = dayParam.safeParse(raw.createdFrom);
  const createdTo = dayParam.safeParse(raw.createdTo);
  return {
    page: numberParam(raw.page, 1),
    pageSize: numberParam(raw.pageSize, 10, 100),
    ...(transactionCode ? { transactionCode } : {}),
    ...(group.success ? { statusGroup: group.data } : {}),
    ...(createdFrom.success ? { createdFrom: createdFrom.data } : {}),
    ...(createdTo.success ? { createdTo: createdTo.data } : {}),
  };
}

/** The page URL: the stage is `status`, as the user sees it. */
export function toWithdrawalSearchParams(filter: WithdrawalListFilter): URLSearchParams {
  const params = new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
  if (filter.transactionCode) params.set("transactionCode", filter.transactionCode);
  if (filter.statusGroup) params.set("status", filter.statusGroup);
  if (filter.createdFrom) params.set("createdFrom", filter.createdFrom);
  if (filter.createdTo) params.set("createdTo", filter.createdTo);
  return params;
}

/** The request to the BFF route, which names the stage `statusGroup`. */
function toListRequestQuery(filter: WithdrawalListFilter): Record<string, string> {
  const params = toWithdrawalSearchParams(filter);
  const status = params.get("status");
  if (status) {
    params.delete("status");
    params.set("statusGroup", status);
  }
  return Object.fromEntries(params);
}

export const withdrawalQueries = {
  list: (filter: WithdrawalListFilter) => queryOptions({
    queryKey: ["withdrawals", "list", filter] as const,
    queryFn: () => apiClient.get<WithdrawalListResult>(WITHDRAWALS_ENDPOINT, { query: toListRequestQuery(filter) }),
  }),
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
  balance: () => queryOptions({
    queryKey: ["withdrawals", "balance"] as const,
    queryFn: () => apiClient.get<WithdrawalBalance>(`${WITHDRAWALS_ENDPOINT}/balance`),
  }),
};
