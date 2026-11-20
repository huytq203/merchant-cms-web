import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient } from "@/lib/http/api-client";
import { formatSubMerchantIds, parseSubMerchantIds } from "@/features/sub-merchants/utils/sub-merchant-ids";
import { withdrawalPocketSchema, withdrawalStatusGroupSchema } from "./schemas/withdrawal.schema";
import type {
  Withdrawal,
  WithdrawalBalance,
  WithdrawalReceivingAccountResult,
  WithdrawalListFilter,
  WithdrawalListResult,
  WithdrawalPocket,
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
  const subMerchantIds = parseSubMerchantIds(raw.subMerchantIds, raw.subMerchantId);
  const createdFrom = dayParam.safeParse(raw.createdFrom);
  const createdTo = dayParam.safeParse(raw.createdTo);
  const pocket = withdrawalPocketSchema.safeParse(raw.pocket);
  return {
    page: numberParam(raw.page, 1),
    pageSize: numberParam(raw.pageSize, 10, 100),
    ...(transactionCode ? { transactionCode } : {}),
    ...(group.success ? { statusGroup: group.data } : {}),
    ...(subMerchantIds.length > 0 ? { subMerchantIds } : {}),
    ...(createdFrom.success ? { createdFrom: createdFrom.data } : {}),
    ...(createdTo.success ? { createdTo: createdTo.data } : {}),
    ...(pocket.success ? { pocket: pocket.data } : {}),
  };
}

/** The page URL: the stage is `status`, as the user sees it. */
export function toWithdrawalSearchParams(filter: WithdrawalListFilter): URLSearchParams {
  const params = new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
  if (filter.transactionCode) params.set("transactionCode", filter.transactionCode);
  if (filter.statusGroup) params.set("status", filter.statusGroup);
  const subMerchantIds = formatSubMerchantIds(filter.subMerchantIds);
  if (subMerchantIds) params.set("subMerchantIds", subMerchantIds);
  if (filter.createdFrom) params.set("createdFrom", filter.createdFrom);
  if (filter.createdTo) params.set("createdTo", filter.createdTo);
  if (filter.pocket) params.set("pocket", filter.pocket);
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
  /** TK đang gán cho Sub (SRS v2: mỗi Sub đúng 1 TK, chỉ hiển thị). Chưa chọn Sub thì không gọi. */
  receivingAccount: (subMerchantId: string) => queryOptions({
    queryKey: ["withdrawals", "receiving-account", subMerchantId] as const,
    queryFn: () => apiClient.get<WithdrawalReceivingAccountResult>(`${WITHDRAWALS_ENDPOINT}/receiving-account`, { query: { subMerchantId } }),
    enabled: subMerchantId !== "",
  }),
  /**
   * Per Sub: nothing is asked until a Sub is chosen. `bankAccountId` is the account assigned to the Sub (optional, v2):
   * BE prices the fee for that account's bank. Empty = the Sub has no account; BE then refuses (5736) or answers with a
   * blocker. `ready` = false while the assigned account is still loading, so the balance is asked once, with its id.
   * `pocket` (GĐ6): the figures of one pocket; part of the key, so choosing another source asks again.
   */
  balance: (subMerchantId: string, bankAccountId = "", ready = true, pocket?: WithdrawalPocket) => queryOptions({
    queryKey: pocket
      ? (["withdrawals", "balance", subMerchantId, bankAccountId, pocket] as const)
      : (["withdrawals", "balance", subMerchantId, bankAccountId] as const),
    queryFn: () => apiClient.get<WithdrawalBalance>(`${WITHDRAWALS_ENDPOINT}/balance`, {
      query: { subMerchantId, ...(bankAccountId ? { bankAccountId } : {}), ...(pocket ? { pocket } : {}) },
    }),
    enabled: subMerchantId !== "" && ready,
  }),
};
