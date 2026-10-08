"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { usePreservedValue } from "@/lib/hooks/use-preserved-value";
import { REASON_LENGTH_MESSAGE, reasonSchema } from "@/lib/schemas/reason";
import type { MerchantUser } from "../schemas/user.schema";
import { UserIdentity } from "./UserIdentity";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MerchantUser | null;
  isPending: boolean;
  error?: string;
  onConfirm: (reason: string) => void;
}

export function UserLockDialog({ open, onOpenChange, user, isPending, error, onConfirm }: Props) {
  const shown = usePreservedValue(user);
  const [reason, setReason] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setReason("");
  }
  const valid = reasonSchema.safeParse(reason).success;
  if (!shown) return null;

  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      title="Khóa người dùng"
      description="Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa."
      reasonLabel="Lý do khóa"
      reasonPlaceholder="Nhập lý do (10 đến 500 ký tự)"
      reasonValue={reason}
      onReasonChange={setReason}
      reasonError={reason && !valid ? REASON_LENGTH_MESSAGE : undefined}
      confirmLabel="Khóa tài khoản"
      confirmDisabled={!valid}
      isLoading={isPending}
      onConfirm={() => onConfirm(reason.trim())}
    >
      <UserIdentity name={shown.fullName} email={shown.email} />
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </ConfirmModal>
  );
}
