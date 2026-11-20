import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import type { MovementDetail, MovementExportFilter, MovementFilter, MovementListResult, MovementPocket } from "./movement-types";

export const MOVEMENT_PAGE_SIZE = 20;

const base = (subMerchantId: string) => `/v1/admin/sub-balances/${subMerchantId}/movements`;

/** Filter without paging: the page is the infinite query's own parameter. */
export type MovementListFilter = Omit<MovementFilter, "page" | "size">;

export const movementQueries = {
  /** Pages of the list. Every filter (pocket included) is part of the key, so each pocket/chip/range keeps its own pages in the cache. */
  list: (subMerchantId: string, filter: MovementListFilter) => infiniteQueryOptions({
    queryKey: ["sub-balance-movements", subMerchantId, "list", filter] as const,
    // flex.merchant đánh số trang từ 1 (spring.data.web.pageable.one-indexed-parameters=true).
    initialPageParam: 1,
    queryFn: ({ pageParam }) => apiClient.get<MovementListResult>(base(subMerchantId), {
      query: { type: filter.type, pocket: filter.pocket, fromDate: filter.fromDate, toDate: filter.toDate, page: pageParam, size: MOVEMENT_PAGE_SIZE },
    }),
    getNextPageParam: (last, pages, lastPageParam) => {
      if (last.rows.length === 0) return undefined;
      const loaded = pages.reduce((sum, page) => sum + page.rows.length, 0);
      return loaded < last.total ? lastPageParam + 1 : undefined;
    },
  }),
  /** `pocket` is the one the list was read with: the amount and balance shown differ per pocket, so the key and the request carry it. */
  detail: (subMerchantId: string, operationId: string, pocket?: MovementPocket) => queryOptions({
    queryKey: ["sub-balance-movements", subMerchantId, "detail", operationId, pocket ?? null] as const,
    queryFn: () => apiClient.get<MovementDetail>(`${base(subMerchantId)}/${operationId}`, { query: { pocket } }),
  }),
};

/**
 * Tải CSV biến động theo bộ lọc hiện tại (không phân trang; BE tối đa 10.000 dòng, không STK/tên người nhận, UTF-8 có BOM).
 * Đọc blob nên đi thẳng bằng `fetch`; lỗi giữ nguyên câu tiếng Việt của BE (6334 vượt dòng, 93 ngày) để màn hình hiện lại.
 */
export async function downloadMovementsCsv(subMerchantId: string, filter: MovementExportFilter): Promise<void> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) if (value) query.set(key, String(value));
  const send = () => fetch(`/api${base(subMerchantId)}/export?${query}`, { credentials: "include", headers: { Accept: "text/csv, application/json" } });
  let response = await send();
  if (response.status === 401) {
    // Cùng cách của apiClient: làm mới phiên một lần; không được thì về trang đăng nhập.
    const refreshed = await fetch("/api/v1/admin/auth/refresh", { method: "POST", credentials: "include" }).then((r) => r.ok, () => false);
    if (refreshed) response = await send();
    if (response.status === 401) window.location.assign(new URL("/api/v1/admin/auth/session-expired", window.location.origin).href);
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Không xuất được file, vui lòng thử lại");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = /filename="?([^";]+)"?/i.exec(response.headers.get("content-disposition") ?? "")?.[1]?.trim() ?? "bien-dong-so-du.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
