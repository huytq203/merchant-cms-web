import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient } from "@/lib/http/api-client";
import { shiftVnDate, vnToday } from "@/lib/utils/vn-time";
import { settlementItemDetailSchema, settlementListResultSchema } from "./schemas";
import type { ResolvedSettlementFilter, SettlementFilter, SettlementItemDetail, SettlementListResult } from "./types";

type RawSearchParams = Record<string, string | string[] | undefined>;

const DEFAULT_PAGE_SIZE = 20;
const RANGE_DAYS = 7;
const day = /^\d{4}-\d{2}-\d{2}$/;

function single(raw: RawSearchParams, key: string): string | undefined {
  const value = raw[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

function positiveInteger(value: string | undefined, fallback: number, max = Infinity): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= max ? parsed : fallback;
}

/** Reads the URL; a missing, malformed or reversed range becomes the last 7 days in Vietnam. */
export function parseSettlementSearchParams(raw: RawSearchParams, now = new Date()): SettlementFilter {
  const paidToDefault = vnToday(now);
  const paidFrom = single(raw, "paidFrom");
  const paidTo = single(raw, "paidTo");
  const rangeValid = !!paidFrom && !!paidTo && day.test(paidFrom) && day.test(paidTo) && paidFrom <= paidTo;
  const subMerchantId = single(raw, "subMerchantId");
  return {
    ...(subMerchantId && z.uuid().safeParse(subMerchantId).success ? { subMerchantId } : {}),
    paidFrom: rangeValid ? paidFrom : shiftVnDate(paidToDefault, 1 - RANGE_DAYS),
    paidTo: rangeValid ? paidTo : paidToDefault,
    page: positiveInteger(single(raw, "page"), 1),
    pageSize: positiveInteger(single(raw, "pageSize"), DEFAULT_PAGE_SIZE, 100),
  };
}

export const settlementItemQueries = {
  list: (filter: ResolvedSettlementFilter) => queryOptions({
    queryKey: ["settlement-items", "list", filter] as const,
    queryFn: async (): Promise<SettlementListResult> =>
      settlementListResultSchema.parse(await apiClient.get<unknown>("/v1/admin/settlement-items", { query: { ...filter } })),
    staleTime: 30_000,
  }),
  detail: (id: string) => queryOptions({
    queryKey: ["settlement-items", "detail", id] as const,
    queryFn: async (): Promise<SettlementItemDetail> =>
      settlementItemDetailSchema.parse(await apiClient.get<unknown>(`/v1/admin/settlement-items/${encodeURIComponent(id)}`)),
    staleTime: 30_000,
  }),
};
