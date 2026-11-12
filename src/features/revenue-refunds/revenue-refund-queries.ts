import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { parseSubMerchantIds } from "@/features/sub-merchants/utils/sub-merchant-ids";
import { refundFilterSchema, refundGroupSchema, refundListResultSchema, refundPeriodSchema, refundStatusSchema, refundSummarySchema, revenueRefundDetailSchema } from "./schemas";
import type { RefundFilter, RefundQuery, RefundSummary, RevenueRefund, RevenueRefundDetail } from "./types";
import { refundQueryString, toRefundQuery } from "./utils/refund-query";

type RawSearchParams = Record<string, string | string[] | undefined>;

/** A request still being written to the ledger settles within a minute or two, so the list re-reads itself meanwhile. */
const PROCESSING_POLL_MS = 30_000;

const REFUNDS_PATH = "/v1/admin/revenue-refunds";
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** URL của trang → bộ lọc; giá trị lạ bị bỏ chứ không làm hỏng trang. */
export function parseRefundSearchParams(raw: RawSearchParams): RefundFilter {
  const status = refundStatusSchema.safeParse(first(raw.status));
  const group = refundGroupSchema.safeParse(first(raw.group));
  const period = refundPeriodSchema.safeParse(first(raw.period));
  const subMerchantIds = parseSubMerchantIds(raw.subMerchantIds, raw.subMerchantId);
  const text = refundFilterSchema.pick({ orderId: true, q: true, from: true, to: true }).safeParse({
    orderId: first(raw.orderId) || undefined,
    q: first(raw.q) || undefined,
    from: first(raw.from) || undefined,
    to: first(raw.to) || undefined,
  });
  // Một trường văn bản sai định dạng thì bỏ cả cụm (không đoán), các trường enum ở trên vẫn giữ.
  const parts = text.success ? text.data : {};
  return {
    ...(status.success ? { status: status.data } : {}),
    ...(group.success ? { group: group.data } : {}),
    ...(period.success ? { period: period.data } : {}),
    ...(subMerchantIds.length > 0 ? { subMerchantIds } : {}),
    ...parts,
  };
}

export const revenueRefundQueries = {
  /** `today` (yyyy-MM-dd giờ VN) do server đưa xuống để kỳ "7 ngày" giống nhau ở SSR và client. */
  list: (filter: RefundFilter, today: string) => {
    const query = toRefundQuery(filter, today);
    return queryOptions({
      queryKey: ["revenue-refunds", "list", query] as const,
      queryFn: async (): Promise<RevenueRefund[]> =>
        refundListResultSchema.parse(await apiClient.get<unknown>(REFUNDS_PATH, { query: { ...query } })).rows,
      staleTime: 15_000,
      refetchInterval: (state) => (state.state.data?.some((refund) => refund.status === "PROCESSING") ? PROCESSING_POLL_MS : false),
    });
  },
  /** Một yêu cầu theo id, cho modal chi tiết. */
  detail: (id: string) =>
    queryOptions({
      queryKey: ["revenue-refunds", "detail", id] as const,
      queryFn: async (): Promise<RevenueRefundDetail> =>
        revenueRefundDetailSchema.parse(await apiClient.get<unknown>(`${REFUNDS_PATH}/${encodeURIComponent(id)}`)),
    }),
  /** Dải đếm: cùng bộ lọc với danh sách nhưng không lọc theo trạng thái (để các nhóm vẫn hiện đủ số). */
  summary: (filter: RefundFilter, today: string) => {
    const query = toRefundQuery({ ...filter, group: undefined, status: undefined }, today);
    return queryOptions({
      queryKey: ["revenue-refunds", "summary", query] as const,
      queryFn: async (): Promise<RefundSummary> =>
        refundSummarySchema.parse(await apiClient.get<unknown>(`${REFUNDS_PATH}/summary`, { query: { ...query } })),
      staleTime: 15_000,
    });
  },
};

/** Tải file CSV của mọi yêu cầu khớp bộ lọc hiện tại (không phân trang). Đọc blob nên đi thẳng bằng `fetch`. */
export async function downloadRefundsCsv(query: RefundQuery): Promise<void> {
  const suffix = refundQueryString(query);
  const response = await fetch(`/api${REFUNDS_PATH}/export${suffix ? `?${suffix}` : ""}`, { credentials: "include" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Không xuất được file, vui lòng thử lại");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = /filename="?([^";]+)"?/i.exec(response.headers.get("content-disposition") ?? "")?.[1]?.trim() ?? "hoan-tien.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
