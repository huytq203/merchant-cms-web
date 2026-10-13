"use client";

import { Button } from "@/components/ui/button/Button";
import { Separator } from "@/components/ui/separator/Separator";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet/Sheet";
import { formatAmount, formatDate } from "@/lib/utils/helper";
import { RefundStatusBadge } from "./RefundStatusBadge";
import type { Refund } from "../types/type";
import {
  RefundFinanceSection,
  RefundReasonSection,
  RefundReconciliationSection,
} from "./RefundDetailSections";
import { RefundHistorySection } from "./RefundHistorySection";

type Props = {
  refund: Refund | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canCancel: boolean;
  onCancel: () => void;
};

export function RefundDetail({ refund, open, onOpenChange, canCancel, onCancel }: Props) {
  const showCancel = canCancel && refund?.status === "pending";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg">
        <SheetHeader>
          <div>
            <SheetTitle>Chi tiết hoàn tiền</SheetTitle>
            {refund && (
              <p className="mt-0.5 font-mono text-sm font-semibold text-primary">{refund.code}</p>
            )}
          </div>
        </SheetHeader>
        {refund && (
          <>
            <SheetBody className="space-y-5">
              <div className="grid gap-1.5 rounded-xl bg-muted p-4">
                <p className="font-mono text-2xl font-bold tabular-nums text-brand-ink">{formatAmount(refund.requestAmount)}</p>
                <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
                  <RefundStatusBadge status={refund.status} />
                  <span>{[refund.createdBy, formatDate(refund.createdAt)].filter(Boolean).join(" · ")}</span>
                </div>
              </div>
              <RefundHistorySection refund={refund} />
              <Separator />
              <RefundFinanceSection refund={refund} />
              <Separator />
              <RefundReconciliationSection refund={refund} />
              {refund.reason && (
                <>
                  <Separator />
                  <RefundReasonSection refund={refund} />
                </>
              )}
            </SheetBody>
            {showCancel && (
              <SheetFooter>
                <Button variant="outline" className="flex-1 border-danger/40 text-danger hover:bg-danger/10" onClick={onCancel}>
                  Hủy yêu cầu
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default RefundDetail;
