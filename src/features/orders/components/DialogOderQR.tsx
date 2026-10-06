"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/Dialog";
import { QRCode } from "@/components/ui/qrcode/QRCode";
import { formatAmount, formatDate } from "@/lib/utils/helper";
import type { Order } from "../types/types";
import { isOrderQrExpired } from "../utils/order-mapper";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  isLoading: boolean;
  loadError?: string;
  canRefresh: boolean;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  refreshError?: string;
  /** A QR was just re-issued in this dialog, so the new code is shown even if the order expiry is unchanged. */
  justRefreshed: boolean;
};

export function DialogOderQR(props: Props) {
  const { open, onOpenChange, order, isLoading, loadError, canRefresh, onRefresh, isRefreshing, refreshError } = props;
  const expired = order ? isOrderQrExpired(order, new Date()) && !props.justRefreshed : false;
  const qrValue = order?.qrCode ?? "";
  const ready = Boolean(order) && !isLoading && !loadError;
  const showRefresh = canRefresh && order?.status === "ACTIVE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mã QR thanh toán</DialogTitle>
          <DialogDescription>
            {order ? `Đơn ${order.orderCode} — ${formatAmount(order.amount)}` : "Đang tải đơn hàng"}
          </DialogDescription>
        </DialogHeader>
        {isLoading && <p className="py-6 text-center text-sm">Đang tải mã QR...</p>}
        {loadError && (
          <p role="alert" className="text-sm text-danger">
            {loadError}
          </p>
        )}
        {order && ready && !expired && qrValue && (
          <div className="flex justify-center py-2">
            <QRCode value={qrValue} size="lg" level="M" renderer="svg" title={`Mã QR đơn ${order.orderCode}`} />
          </div>
        )}
        {ready && !expired && !qrValue && (
          <p className="py-6 text-center text-sm text-muted-foreground">Đơn hàng chưa có mã QR.</p>
        )}
        {order && ready && expired && (
          <p role="status" className="py-6 text-center text-sm text-muted-foreground">
            Mã QR đã hết hạn từ {formatDate(order.expiredAt)}. Làm mới để lấy mã mới.
          </p>
        )}
        {refreshError && (
          <p role="alert" className="text-sm text-danger">
            {refreshError}
          </p>
        )}
        {showRefresh && (
          <Button type="button" variant="outline" isLoading={isRefreshing} onClick={() => void onRefresh()}>
            <RefreshCw size={16} aria-hidden="true" /> Làm mới QR
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
