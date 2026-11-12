import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient } from "@/lib/http/api-client";
import { formatSubMerchantIds, parseSubMerchantIds } from "@/features/sub-merchants/utils/sub-merchant-ids";
import { shiftVnDate, vnToday } from "@/lib/utils/vn-time";
import { settlementItemDetailSchema, settlementListResultSchema, trancheGroupSchema } from "./schemas";
import type { ResolvedSettlementFilter, SettlementFilter, SettlementItemDetail, SettlementListResult } from "./types";

type RawSearchParams = Record<string, string | string[] | undefined>;

const DEFAULT_PAGE_SIZE = 20;
const RANGE_DAYS = 7;
const day = /^\d{4}-\d{2}-\d{2}$/;

/** Khoảng ngày dài nhất BE nhận cho danh sách quyết toán, tính cả hai ngày đầu cuối (MAX_RANGE_DAYS, quyết định BA 23/10). */
export const MAX_SETTLEMENT_RANGE_DAYS = 92;
const DAY_MS = 86_400_000;

/**
 * Câu lỗi khi khoảng ngày vượt {@link MAX_SETTLEMENT_RANGE_DAYS} ngày, null khi hợp lệ hoặc chưa đủ hai ngày/đảo ngược
 * (những trường hợp đó có chỗ xử lý riêng). Chặn trước khi gọi để người dùng không phải chờ một lỗi 400 từ BE.
 */
export function settlementRangeError(paidFrom: string, paidTo: string): string | null {
  if (!day.test(paidFrom) || !day.test(paidTo) || paidFrom > paidTo) return null;
  const days = (Date.parse(`${paidTo}T00:00:00Z`) - Date.parse(`${paidFrom}T00:00:00Z`)) / DAY_MS + 1;
  return days > MAX_SETTLEMENT_RANGE_DAYS ? `Khoảng ngày tối đa ${MAX_SETTLEMENT_RANGE_DAYS} ngày` : null;
}

function single(raw: RawSearchParams, key: string): string | undefined {
  const value = raw[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

function positiveInteger(value: string | undefined, fallback: number, max = Infinity): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= max ? parsed : fallback;
}

/**
 * Reads the URL; a missing, malformed, reversed or longer-than-92-days range becomes the last 7 days in Vietnam. Sub/Terminal không phải UUID
 * và nhóm trạng thái lạ bị bỏ (= Tất cả).
 */
export function parseSettlementSearchParams(raw: RawSearchParams, now = new Date()): SettlementFilter {
  const paidToDefault = vnToday(now);
  const paidFrom = single(raw, "paidFrom");
  const paidTo = single(raw, "paidTo");
  // Khoảng quá 92 ngày (URL gõ tay hoặc chia sẻ) cũng coi là không hợp lệ: BE sẽ từ chối nên không gọi với nó.
  const rangeValid = !!paidFrom && !!paidTo && day.test(paidFrom) && day.test(paidTo) && paidFrom <= paidTo
    && settlementRangeError(paidFrom, paidTo) === null;
  const subMerchantIds = parseSubMerchantIds(raw.subMerchantIds, raw.subMerchantId);
  const terminalId = single(raw, "terminalId");
  const trancheStatus = trancheGroupSchema.safeParse(single(raw, "trancheStatus"));
  return {
    ...(subMerchantIds.length > 0 ? { subMerchantIds } : {}),
    ...(terminalId && z.uuid().safeParse(terminalId).success ? { terminalId } : {}),
    ...(trancheStatus.success ? { trancheStatus: trancheStatus.data } : {}),
    paidFrom: rangeValid ? paidFrom : shiftVnDate(paidToDefault, 1 - RANGE_DAYS),
    paidTo: rangeValid ? paidTo : paidToDefault,
    page: positiveInteger(single(raw, "page"), 1),
    pageSize: positiveInteger(single(raw, "pageSize"), DEFAULT_PAGE_SIZE, 100),
  };
}

/** Query gửi lên route Next: apiClient chỉ nhận giá trị đơn, nên danh sách Sub nối dấu phẩy (rỗng = không gửi). */
export function settlementQueryParams(filter: ResolvedSettlementFilter) {
  const { subMerchantIds, ...rest } = filter;
  return { ...rest, subMerchantIds: formatSubMerchantIds(subMerchantIds) };
}

export const settlementItemQueries = {
  list: (filter: ResolvedSettlementFilter) => queryOptions({
    queryKey: ["settlement-items", "list", filter] as const,
    queryFn: async (): Promise<SettlementListResult> =>
      settlementListResultSchema.parse(await apiClient.get<unknown>("/v1/admin/settlement-items", { query: settlementQueryParams(filter) })),
    staleTime: 30_000,
  }),
  detail: (id: string) => queryOptions({
    queryKey: ["settlement-items", "detail", id] as const,
    queryFn: async (): Promise<SettlementItemDetail> =>
      settlementItemDetailSchema.parse(await apiClient.get<unknown>(`/v1/admin/settlement-items/${encodeURIComponent(id)}`)),
    staleTime: 30_000,
  }),
};
