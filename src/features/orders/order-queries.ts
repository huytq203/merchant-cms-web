import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { formatSubMerchantIds, parseSubMerchantIds } from "@/features/sub-merchants/utils/sub-merchant-ids";
import { orderStatusSchema } from "./schemas/order.schema";
import { orderRequest } from "./order-api";
import type { Order, OrderListFilter, OrderListResult } from "./types/types";

type RawSearchParams = Record<string, string | string[] | undefined>;

function numberParam(value: string | string[] | undefined, fallback: number, max = Infinity): number {
  const parsed = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
}

const dayParam = z.iso.date();

export function parseOrderSearchParams(raw: RawSearchParams): OrderListFilter {
  const orderCode = typeof raw.orderCode === "string" ? raw.orderCode.trim().slice(0, 100) : "";
  const status = orderStatusSchema.safeParse(raw.status);
  const subMerchantIds = parseSubMerchantIds(raw.subMerchantIds, raw.subMerchantId);
  const createdFrom = dayParam.safeParse(raw.createdFrom);
  const createdTo = dayParam.safeParse(raw.createdTo);
  return {
    page: numberParam(raw.page, 1),
    pageSize: numberParam(raw.pageSize, 10, 100),
    ...(orderCode ? { orderCode } : {}),
    ...(status.success ? { status: status.data } : {}),
    ...(subMerchantIds.length > 0 ? { subMerchantIds } : {}),
    ...(createdFrom.success ? { createdFrom: createdFrom.data } : {}),
    ...(createdTo.success ? { createdTo: createdTo.data } : {}),
  };
}

export function toOrderSearchParams(filter: OrderListFilter): URLSearchParams {
  const params = new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
  if (filter.orderCode) params.set("orderCode", filter.orderCode);
  if (filter.status) params.set("status", filter.status);
  const subMerchantIds = formatSubMerchantIds(filter.subMerchantIds);
  if (subMerchantIds) params.set("subMerchantIds", subMerchantIds);
  if (filter.createdFrom) params.set("createdFrom", filter.createdFrom);
  if (filter.createdTo) params.set("createdTo", filter.createdTo);
  return params;
}

export const orderQueries = {
  list: (filter: OrderListFilter) => queryOptions({
    queryKey: ["orders", "list", filter] as const,
    queryFn: () => orderRequest<OrderListResult>(`?${toOrderSearchParams(filter)}`),
  }),
  detail: (id: string) => queryOptions({
    queryKey: ["orders", "detail", id] as const,
    queryFn: () => orderRequest<Order>(`/${encodeURIComponent(id)}`),
  }),
};
