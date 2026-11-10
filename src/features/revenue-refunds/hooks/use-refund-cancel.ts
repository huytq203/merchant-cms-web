"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/http/api-client";
import type { RevenueRefund } from "../types";
import { describeRefundError } from "./use-refund-otp-step";

/**
 * Hủy yêu cầu Chờ phê duyệt: mở hộp xác nhận ngay trong trang (không dùng confirm() của trình duyệt), gọi BE rồi làm mới
 * danh sách và dải đếm. Lỗi của BE (không phải người tạo, đã được duyệt trong lúc đó...) hiện ngay trong hộp.
 */
export function useRefundCancel() {
  const client = useQueryClient();
  const [target, setTarget] = useState<RevenueRefund | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const cancel = useMutation({
    mutationFn: (id: string) => apiClient.post<RevenueRefund>(`/v1/admin/revenue-refunds/${encodeURIComponent(id)}/cancel`, undefined, { toast: false }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["revenue-refunds"] }),
  });

  const open = (refund: RevenueRefund) => {
    cancel.reset();
    setFailure(null);
    setTarget(refund);
  };
  const close = () => {
    if (!cancel.isPending) setTarget(null);
  };
  const confirm = async () => {
    if (!target) return;
    setFailure(null);
    try {
      await cancel.mutateAsync(target.id);
      toast.success(`Đã hủy yêu cầu hoàn tiền ${target.refundCode}`);
      setTarget(null);
    } catch (error) {
      setFailure(describeRefundError(error));
    }
  };

  return { target, open, close, confirm, failure, isCancelling: cancel.isPending };
}

export type RefundCancel = ReturnType<typeof useRefundCancel>;
