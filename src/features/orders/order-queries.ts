import { queryOptions } from "@tanstack/react-query";
import { orderStatusSchema } from "./schemas/order.schema";
import { orderRequest } from "./order-api";
import type { Order, OrderListFilter, OrderListResult } from "./types/types";

type RawSearchParams = Record<string, string | string[] | undefined>;

function numberParam(value: string | string[] | undefined, fallback: number, max = Infinity): number {
  const parsed = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
}

export function parseOrderSearchParams(raw: RawSearchParams): OrderListFilter {
  const orderCode = typeof raw.orderCode === "string" ? raw.orderCode.trim().slice(0, 100) : "";
  const status = orderStatusSchema.safeParse(raw.status);
  return {
    page: numberParam(raw.page, 1),
    pageSize: numberParam(raw.pageSize, 10, 100),
    ...(orderCode ? { orderCode } : {}),
    ...(status.success ? { status: status.data } : {}),
  };
}

export function toOrderSearchParams(filter: OrderListFilter): URLSearchParams {
  const params = new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
  if (filter.orderCode) params.set("orderCode", filter.orderCode);
  if (filter.status) params.set("status", filter.status);
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
