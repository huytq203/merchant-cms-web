"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useNow } from "../hooks/use-now";
import type { Order } from "../types/types";
import { isOrderQrExpired } from "../utils/order-mapper";
import { OrderQrPanel } from "./OrderQrPanel";

export type OrderQrSectionProps = {
  order: Order | null;
  isLoading: boolean;
  loadError?: string;
  canRefresh: boolean;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  refreshError?: string;
  /** A QR was just re-issued here, so the new code is shown even if the order expiry is unchanged. */
  justRefreshed: boolean;
};

/** The payment QR of one order with its loading, expired and refresh states; shared by the QR and detail dialogs. */
export function OrderQrSection(props: OrderQrSectionProps) {
  const { order, isLoading, loadError, canRefresh, onRefresh, isRefreshing, refreshError } = props;
  const now = useNow(order?.status === "ACTIVE");
  const ready = Boolean(order) && !isLoading && !loadError;
  const expired = order ? isOrderQrExpired(order, now) && !props.justRefreshed : false;
  const qrValue = order?.qrCode ?? "";
  const showRefresh = canRefresh && order?.status === "ACTIVE";

  return (
    <div className="flex flex-col items-center gap-3">
      {isLoading && <p className="py-6 text-center text-sm">Đang tải mã QR...</p>}
      {loadError && (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      )}
      {order && ready && !expired && qrValue && <OrderQrPanel order={order} qrValue={qrValue} now={now} />}
      {ready && !expired && !qrValue && (
        <p className="py-6 text-center text-sm text-muted-foreground">Đơn hàng chưa có mã QR.</p>
      )}
      {order && ready && expired && (
        <p role="status" className="py-6 text-center text-sm text-muted-foreground">
          Mã QR đã hết hạn. Làm mới để lấy mã mới.
        </p>
      )}
      {refreshError && (
        <p role="alert" className="text-sm text-danger">
          {refreshError}
        </p>
      )}
      {showRefresh && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" size="sm" isLoading={isRefreshing} onClick={() => void onRefresh()}>
            <RefreshCw size={15} aria-hidden="true" /> Làm mới QR
          </Button>
        </div>
      )}
    </div>
  );
}
