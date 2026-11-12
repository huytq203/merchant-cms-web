"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Đọc/ghi `?detail=<id>` để một liên kết (thông báo, push) mở thẳng modal chi tiết của trang.
 * Chỉ nhận UUID: giá trị khác bị coi là không có, nên chuỗi lạ trên URL không bao giờ chạm tới API.
 * Ghi bằng `router.replace` (không thêm bước vào lịch sử) và giữ nguyên các tham số lọc khác.
 */
export function useDetailParam(): { detailId: string | null; openDetail: (id: string) => void; closeDetail: () => void } {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = searchParams?.get("detail") ?? null;
  const detailId = raw !== null && UUID.test(raw) ? raw : null;
  const hasDetail = searchParams?.has("detail") ?? false;

  const write = useCallback((id: string | null) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    if (id) next.set("detail", id);
    else next.delete("detail");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [router, pathname, searchParams]);

  const openDetail = useCallback((id: string) => write(id), [write]);
  // Không có `detail` trên URL (modal mở từ dòng của bảng) thì không cần đụng tới URL.
  const closeDetail = useCallback(() => { if (hasDetail) write(null); }, [hasDetail, write]);

  return { detailId, openDetail, closeDetail };
}
