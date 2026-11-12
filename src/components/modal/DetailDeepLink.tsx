"use client";

import { useEffect, useRef } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { useDetailParam } from "@/hooks/use-detail-param";

/** Câu hiển thị khi người dùng không có quyền xem mục trong liên kết hoặc mục đó không còn. */
export const DETAIL_UNAVAILABLE_MESSAGE = "Bạn không có quyền xem hoặc mục này không còn tồn tại";

/** 403/404 đều nói chung một câu để không lộ việc mục có tồn tại hay không; lỗi khác giữ thông báo của API. */
export function detailErrorMessage(error: unknown): string {
  const status = (error as { status?: number } | null)?.status;
  if (status === 403 || status === 404) return DETAIL_UNAVAILABLE_MESSAGE;
  return error instanceof Error && error.message ? error.message : DETAIL_UNAVAILABLE_MESSAGE;
}

export function DetailUnavailableDialog({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>Không mở được chi tiết</DialogTitle></DialogHeader>
        <DialogBody><p role="alert" className="text-sm">{message}</p></DialogBody>
        <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Đóng</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Props<T, K extends readonly unknown[]> = {
  /** Truy vấn chi tiết theo id; dùng lại query của trang để bản đọc được tái sử dụng khi modal mở. */
  query: (id: string) => UseQueryOptions<T, Error, T, K>;
  /** Gọi đúng một lần mỗi `?detail=` khi bản ghi đã tải xong: trang mở modal có sẵn của nó. */
  onLoaded: (item: T) => void;
};

/**
 * Nối `?detail=<id>` vào modal chi tiết có sẵn của một trang: tải bản ghi rồi gọi `onLoaded`; nếu API trả 403/404
 * thì hiện hộp thông báo thay vì làm hỏng trang (danh sách phía sau vẫn dùng được). Đóng hộp xóa `detail` khỏi URL.
 */
export function DetailDeepLink<T, K extends readonly unknown[]>({ query, onLoaded }: Props<T, K>) {
  const { detailId, closeDetail } = useDetailParam();
  const handled = useRef<string | null>(null);
  const result = useQuery({ ...query(detailId ?? ""), enabled: detailId !== null, retry: false });

  useEffect(() => {
    if (detailId === null) {
      handled.current = null;
      return;
    }
    if (result.data !== undefined && handled.current !== detailId) {
      handled.current = detailId;
      onLoaded(result.data);
    }
  }, [detailId, result.data, onLoaded]);

  if (detailId === null || !result.isError) return null;
  return <DetailUnavailableDialog message={detailErrorMessage(result.error)} onClose={closeDetail} />;
}
