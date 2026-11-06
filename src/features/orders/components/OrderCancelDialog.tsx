"use client";

import { ConfirmModal } from "@/components/modal";
import { Notice } from "@/components/page/Notice";
import { ApiError } from "@/lib/http/api-client";
import { isCancelOutcomeUncertain } from "../constants/order-cancel";
import type { Order } from "../types/types";
import { canCancelOrder } from "../utils/order-mapper";

type Props = {
  order: Order | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  /** The order is being read again after a failed cancel. */
  isReloading: boolean;
  /** Message when reading the order failed, so its status is unknown. */
  loadError?: string;
  error: Error | null;
};

/** Confirms cancelling an unpaid order; a refusal from the bank keeps it open and says the order may have been paid. */
export function OrderCancelDialog({ order, onClose, onConfirm, isPending, isReloading, loadError, error }: Props) {
  const cancellable = order ? canCancelOrder(order.status) : false;
  const uncertain = error instanceof ApiError && isCancelOutcomeUncertain(error.code);
  return (
    <ConfirmModal
      open={order !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Hủy đơn hàng"
      description={`Hủy đơn ${order?.orderCode ?? ""}? Mã QR sẽ không dùng được nữa. Khách không nên thanh toán đơn đã hủy.`}
      confirmLabel={uncertain ? "Thử hủy lại" : "Hủy đơn"}
      cancelLabel="Giữ đơn"
      isLoading={isPending}
      confirmDisabled={!cancellable || isReloading || Boolean(loadError)}
      onConfirm={onConfirm}
    >
      {order && !cancellable ? <Notice tone="warning">Đơn không còn chờ thanh toán nên không hủy được nữa.</Notice> : null}
      {error ? <Notice tone="danger">{error.message}</Notice> : null}
      {loadError ? <Notice tone="danger">Không tải được trạng thái đơn: {loadError}</Notice> : null}
      {isReloading ? <p role="status" className="text-sm text-muted-foreground">Đang tải lại trạng thái đơn...</p> : null}
    </ConfirmModal>
  );
}
