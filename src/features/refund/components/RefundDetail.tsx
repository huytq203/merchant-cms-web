"use client";

import { Badge } from "@/components/ui/badge/Badge";
import { Separator } from "@/components/ui/separator/Separator";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet/Sheet";
import { REFUND_STATUS_OPTIONS } from "../constants/Refund.constants";
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
};

export function RefundDetail({ refund, open, onOpenChange }: Props) {
  const statusOption = refund
    ? REFUND_STATUS_OPTIONS.find((option) => option.value === refund.status)
    : undefined;

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
          <SheetBody className="space-y-5">
            <div>
              <Badge
                variant={statusOption?.variant ?? "outline"}
                size="lg"
                pulse={refund.status === "pending"}
              >
                {statusOption?.label ?? refund.status}
              </Badge>
            </div>
            <RefundFinanceSection refund={refund} />
            <Separator />
            <RefundReconciliationSection refund={refund} />
            {refund.reason && (
              <>
                <Separator />
                <RefundReasonSection refund={refund} />
              </>
            )}
            <Separator />
            <RefundHistorySection refund={refund} />
          </SheetBody>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default RefundDetail;
