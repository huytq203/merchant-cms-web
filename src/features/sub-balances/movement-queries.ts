import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import type { MovementDetail, MovementFilter, MovementListResult } from "./movement-types";

export const MOVEMENT_PAGE_SIZE = 20;

const base = (subMerchantId: string) => `/v1/admin/sub-balances/${subMerchantId}/movements`;

/** Filter without paging: the page is the infinite query's own parameter. */
export type MovementListFilter = Omit<MovementFilter, "page" | "size">;

export const movementQueries = {
  /** Pages of the list. Every filter is part of the key, so each chip/range keeps its own pages in the cache. */
  list: (subMerchantId: string, filter: MovementListFilter) => infiniteQueryOptions({
    queryKey: ["sub-balance-movements", subMerchantId, "list", filter] as const,
    // flex.merchant đánh số trang từ 1 (spring.data.web.pageable.one-indexed-parameters=true).
    initialPageParam: 1,
    queryFn: ({ pageParam }) => apiClient.get<MovementListResult>(base(subMerchantId), {
      query: { type: filter.type, fromDate: filter.fromDate, toDate: filter.toDate, page: pageParam, size: MOVEMENT_PAGE_SIZE },
    }),
    getNextPageParam: (last, pages, lastPageParam) => {
      if (last.rows.length === 0) return undefined;
      const loaded = pages.reduce((sum, page) => sum + page.rows.length, 0);
      return loaded < last.total ? lastPageParam + 1 : undefined;
    },
  }),
  detail: (subMerchantId: string, operationId: string) => queryOptions({
    queryKey: ["sub-balance-movements", subMerchantId, "detail", operationId] as const,
    queryFn: () => apiClient.get<MovementDetail>(`${base(subMerchantId)}/${operationId}`),
  }),
};
