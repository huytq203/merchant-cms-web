import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { refundFilterSchema, refundListResultSchema, refundStatusSchema } from "./schemas";
import type { RefundFilter, RevenueRefund } from "./types";

type RawSearchParams = Record<string, string | string[] | undefined>;

/** A request still being written to the ledger settles within a minute or two, so the list re-reads itself meanwhile. */
const PROCESSING_POLL_MS = 30_000;

export function parseRefundSearchParams(raw: RawSearchParams): RefundFilter {
  const status = refundStatusSchema.safeParse(raw.status);
  const orderId = refundFilterSchema.shape.orderId.safeParse(raw.orderId);
  return {
    ...(status.success ? { status: status.data } : {}),
    ...(orderId.success && orderId.data ? { orderId: orderId.data } : {}),
  };
}

export const revenueRefundQueries = {
  list: (filter: RefundFilter) => queryOptions({
    queryKey: ["revenue-refunds", "list", filter] as const,
    queryFn: async (): Promise<RevenueRefund[]> =>
      refundListResultSchema.parse(await apiClient.get<unknown>("/v1/admin/revenue-refunds", { query: { ...filter } })).rows,
    staleTime: 15_000,
    refetchInterval: (query) => (query.state.data?.some((refund) => refund.status === "PROCESSING") ? PROCESSING_POLL_MS : false),
  }),
};
