"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ResolvedSettlementFilter } from "../types";

/** The filter lives in the URL so the server prefetches exactly what the client then owns. */
export function useSettlementNavigation(filter: ResolvedSettlementFilter) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (next: ResolvedSettlementFilter) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) params.set(key, String(value));
    router.push(`${pathname}?${params.toString()}`);
  };

  return {
    search: (range: Pick<ResolvedSettlementFilter, "subMerchantId" | "paidFrom" | "paidTo">) => navigate({ ...range, page: 1, pageSize: filter.pageSize }),
    /** Without dates the server falls back to the last 7 days. */
    clear: () => router.push(`${pathname}?subMerchantId=${encodeURIComponent(filter.subMerchantId)}`),
    changePage: (page: number, pageSize: number) => navigate({ ...filter, page, pageSize }),
  };
}
