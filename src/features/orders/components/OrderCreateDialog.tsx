"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog/Dialog";
import type { OrderFormData } from "../schemas/order.schema";
import type { Order } from "../types/types";
import { OrderCreatedStep } from "./OrderCreatedStep";
import { OrderFormBody } from "./OrderFormBody";

type Props = {
  onClose: () => void;
  /** The order just created; while set, the dialog shows its QR instead of the form. */
  created: Order | null;
  onSubmit: (values: OrderFormData) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
  serverErrors: Record<string, string>;
  onViewDetail: (order: Order) => void;
  onCreateAnother: () => void;
};

/** One dialog for the whole flow, so creating another order does not close and reopen it. */
export function OrderCreateDialog(props: Props) {
  const { onClose, created } = props;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size={created ? "sm" : "lg"} className="overflow-hidden">
        {created ? (
          <OrderCreatedStep
            order={created}
            onViewDetail={() => props.onViewDetail(created)}
            onCreateAnother={props.onCreateAnother}
          />
        ) : (
          <OrderFormBody
            onCancel={onClose}
            onSubmit={props.onSubmit}
            isSubmitting={props.isSubmitting}
            error={props.error}
            serverErrors={props.serverErrors}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
