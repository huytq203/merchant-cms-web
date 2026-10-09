import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "../schemas/order.schema";
import { ORDER_STEPS, orderStepStates, type StepState } from "../utils/order-timeline";

const dotClass: Record<StepState, string> = {
  done: "border-success bg-success text-white",
  current: "border-primary bg-primary text-primary-foreground",
  failed: "border-danger bg-danger text-white",
  upcoming: "border-border bg-background text-muted-foreground",
};

const labelClass: Record<StepState, string> = {
  done: "text-foreground",
  current: "font-bold text-foreground",
  failed: "font-bold text-danger",
  upcoming: "text-muted-foreground",
};

/** Where an order is on its way from creation to credit; a failed step is flagged, not hidden. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  const states = orderStepStates(status);
  return (
    <ol aria-label="Tiến trình đơn hàng" className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {ORDER_STEPS.map((step, index) => (
        <li
          key={step}
          aria-current={states[index] === "current" || states[index] === "failed" ? "step" : undefined}
          className={cn("flex items-center gap-1.5 text-xs font-medium", labelClass[states[index]!])}
        >
          <span
            aria-hidden="true"
            className={cn("flex size-[18px] items-center justify-center rounded-full border text-[10px]", dotClass[states[index]!])}
          >
            {states[index] === "done" ? <Check size={11} strokeWidth={3} /> : index + 1}
          </span>
          {step}
          {index < ORDER_STEPS.length - 1 ? <span aria-hidden="true" className="mx-1 h-px w-4 bg-border" /> : null}
        </li>
      ))}
    </ol>
  );
}
