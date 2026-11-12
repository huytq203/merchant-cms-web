import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { formatSubMerchantIds, parseSubMerchantIds } from "@/features/sub-merchants/utils/sub-merchant-ids";
import type { BankAccount, BankAccountFilter, BankAccountList } from "./types";

export const BANK_ACCOUNTS_ENDPOINT = "/v1/admin/bank-accounts";

type RawSearchParams = Record<string, string | string[] | undefined>;

const LINK_STATUSES = ["PENDING_VERIFICATION", "LINKED", "LINK_FAILED"] as const;
const USAGE_STATUSES = ["ACTIVE", "INACTIVE"] as const;

function numberParam(value: string | string[] | undefined, fallback: number, max = Infinity): number {
  const parsed = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
}

function oneOf<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  return allowed.find((item) => item === value);
}

/** The Master is not read from the URL: the page takes it from the session. */
export function parseBankAccountSearchParams(raw: RawSearchParams): BankAccountFilter {
  const linkStatus = oneOf(raw.linkStatus, LINK_STATUSES);
  const status = oneOf(raw.status, USAGE_STATUSES);
  // Lọc theo nhiều Sub (12/11/2026): chỉ nhận UUID hợp lệ để link sửa tay không làm BE trả 400; `subMerchantId` cũ vẫn đọc được.
  const subMerchantIds = parseSubMerchantIds(raw.subMerchantIds, raw.subMerchantId);
  return {
    page: numberParam(raw.page, 1),
    pageSize: numberParam(raw.pageSize, 10, 100),
    ...(linkStatus ? { linkStatus } : {}),
    ...(status ? { status } : {}),
    ...(subMerchantIds.length > 0 ? { subMerchantIds } : {}),
  };
}

export const bankAccountQueries = {
  list: (filter: BankAccountFilter) => queryOptions({
    queryKey: ["bank-accounts", "list", filter] as const,
    queryFn: () => apiClient.get<BankAccountList>(BANK_ACCOUNTS_ENDPOINT, {
      query: {
        page: filter.page,
        pageSize: filter.pageSize,
        subMerchantIds: formatSubMerchantIds(filter.subMerchantIds),
        linkStatus: filter.linkStatus,
        status: filter.status,
      },
    }),
  }),
  detail: (id: string) => queryOptions({
    queryKey: ["bank-accounts", "detail", id] as const,
    queryFn: () => apiClient.get<BankAccount>(`${BANK_ACCOUNTS_ENDPOINT}/${id}`),
  }),
};
