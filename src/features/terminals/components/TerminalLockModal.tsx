"use client";

import { DangerNotice, ReasonConfirmModal } from "@/components/modal/ReasonConfirmModal";
import type { TerminalRow } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: TerminalRow | null;
  action: "lock" | "unlock";
  onConfirm: (reason: string) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
};

const copy = {
  lock: {
    title: "Khóa Terminal",
    description: "",
    reasonLabel: "Lý do khóa",
    confirmLabel: "Khóa Terminal",
    confirmVariant: "danger",
    notice: <DangerNotice>Terminal ngừng hoạt động cho đến khi được mở khóa.</DangerNotice>,
  },
  unlock: {
    title: "Mở khóa Terminal",
    description: "Terminal hoạt động trở lại sau khi mở khóa.",
    reasonLabel: "Lý do mở khóa",
    confirmLabel: "Mở khóa",
    confirmVariant: "solid",
  },
} as const;

export function TerminalLockModal({ open, onOpenChange, target, action, onConfirm, isSubmitting, error }: Props) {
  const subtitle = [target?.tid, target?.subMerchantName].filter(Boolean).join("  ");

  return (
    <ReasonConfirmModal
      {...copy[action]}
      open={open}
      onOpenChange={onOpenChange}
      target={target ? { title: target.name, subtitle } : null}
      isLoading={isSubmitting}
      error={error}
      onConfirm={onConfirm}
    />
  );
}
