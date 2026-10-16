"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button/Button";
import type { OrderStatus } from "../types/types";

interface Props {
  orderId: string;
  status: OrderStatus;
  /** CREATE_REFUND */
  canCreate: boolean;
  /** VIEW_REFUND */
  canView: boolean;
  onRefund: () => void;
}

/** Only a paid order can be refunded; each action shows only to a session allowed to use it. */
export function OrderRefundActions({ orderId, status, canCreate, canView, onRefund }: Props) {
  if (status !== "SUCCESS" || (!canCreate && !canView)) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {canView ? (
        <Button variant="outline" nativeButton={false} render={<Link href={`/revenue-refunds?orderId=${orderId}`} role="link" />}>
          Xem yêu cầu hoàn tiền
        </Button>
      ) : null}
      {canCreate ? <Button type="button" variant="solid" onClick={onRefund}>Hoàn tiền</Button> : null}
    </div>
  );
}
