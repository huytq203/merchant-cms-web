"use client";

import { DangerNotice, ReasonConfirmModal, type ReasonConfirmModalProps } from "@/components/modal/ReasonConfirmModal";
import type { SubMerchantRow } from "../types";

export type ReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  /** The Sub-merchant being changed, named in the dialog so the action is never ambiguous. */
  target?: Pick<SubMerchantRow, "code" | "name"> | null;
};

type Copy = Pick<ReasonConfirmModalProps, "title" | "description" | "reasonLabel" | "confirmLabel" | "confirmVariant" | "notice">;

export const lockCopy: Copy = {
  title: "Khóa Sub-merchant",
  description: "Sub-merchant ngừng hoạt động cho đến khi được mở khóa.",
  reasonLabel: "Lý do khóa",
  confirmLabel: "Khóa Sub-merchant",
  confirmVariant: "danger",
  notice: <DangerNotice>Các terminal thuộc Sub-merchant này cũng bị khóa theo. Bạn có thể mở khóa lại sau.</DangerNotice>,
};

export const unlockCopy: Copy = {
  title: "Mở khóa Sub-merchant",
  description: "Sub-merchant hoạt động trở lại sau khi mở khóa.",
  reasonLabel: "Lý do mở khóa",
  confirmLabel: "Mở khóa",
  confirmVariant: "solid",
};

export function ReasonDialog({ copy, target, ...rest }: ReasonDialogProps & { copy: Copy }) {
  return <ReasonConfirmModal {...copy} {...rest} target={target ? { title: target.name, subtitle: target.code } : null} />;
}

export function DialogActive(props: ReasonDialogProps) {
  return <ReasonDialog copy={lockCopy} {...props} />;
}
