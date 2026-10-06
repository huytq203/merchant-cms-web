import { useState } from "react";
import type { Refund } from "../types/type";

export type RefundDialog = "detail" | "cancel";

/** One open dialog at a time, always about the same selected refund. */
export function useRefundDialogs() {
  const [target, setTarget] = useState<Refund | null>(null);
  const [activeDialog, setActiveDialog] = useState<RefundDialog | null>(null);

  const openFor = (dialog: RefundDialog, refund: Refund) => {
    setTarget(refund);
    setActiveDialog(dialog);
  };
  const close = () => setActiveDialog(null);

  return { target, activeDialog, openFor, close };
}
