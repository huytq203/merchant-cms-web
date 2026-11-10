"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ResolvedSettlementFilter } from "../types";

/** Các ô của card bộ lọc; trang luôn về 1 khi đổi bộ lọc. */
export type SettlementCriteria = Pick<ResolvedSettlementFilter, "subMerchantId" | "terminalId" | "trancheStatus" | "paidFrom" | "paidTo">;

/** The filter lives in the URL so the server prefetches exactly what the client then owns. */
export function useSettlementNavigation(filter: ResolvedSettlementFilter) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (next: ResolvedSettlementFilter) => {
    const params = new URLSearchParams();
    // Bỏ khóa rỗng: không có Sub/Terminal/trạng thái nghĩa là "Tất cả".
    for (const [key, value] of Object.entries(next)) if (value !== undefined && value !== "") params.set(key, String(value));
    router.push(`${pathname}?${params.toString()}`);
  };

  return {
    search: (criteria: SettlementCriteria) => navigate({ ...criteria, page: 1, pageSize: filter.pageSize }),
    /** Về mặc định: mọi Sub, 7 ngày gần nhất (server tự điền khi URL không có ngày). */
    clear: () => router.push(pathname),
    /** Dải "Theo Sub": lọc nhanh một Sub; Terminal cũ có thể thuộc Sub khác nên bỏ. */
    pickSub: (subMerchantId: string) => navigate({ ...filter, subMerchantId, terminalId: undefined, page: 1 }),
    changePage: (page: number, pageSize: number) => navigate({ ...filter, page, pageSize }),
  };
}
