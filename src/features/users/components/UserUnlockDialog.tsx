"use client";

import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { usePreservedValue } from "@/lib/hooks/use-preserved-value";
import type { MerchantUser } from "../schemas/user.schema";
import { UserIdentity } from "./UserIdentity";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MerchantUser | null;
  isPending: boolean;
  error?: string;
  onConfirm: () => void;
}

export function UserUnlockDialog({ open, onOpenChange, user, isPending, error, onConfirm }: Props) {
  const shown = usePreservedValue(user);
  if (!shown) return null;

  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      title="Mở khóa người dùng"
      description="Người dùng sẽ đăng nhập lại được sau khi mở khóa."
      confirmVariant="solid"
      confirmLabel="Mở khóa"
      isLoading={isPending}
      onConfirm={onConfirm}
    >
      <UserIdentity name={shown.fullName} email={shown.email} />
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </ConfirmModal>
  );
}
