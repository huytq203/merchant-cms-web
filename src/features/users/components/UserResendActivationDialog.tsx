"use client";

import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { usePreservedValue } from "@/lib/hooks/use-preserved-value";
import type { MerchantUser } from "../schemas/user.schema";
import { nameOf } from "../utils/user-view";
import { UserIdentity } from "./UserIdentity";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MerchantUser | null;
  isPending: boolean;
  error?: string;
  onConfirm: () => void;
}

export function UserResendActivationDialog({ open, onOpenChange, user, isPending, error, onConfirm }: Props) {
  const shown = usePreservedValue(user);
  if (!shown) return null;

  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      title="Gửi lại liên kết kích hoạt"
      description="Hệ thống gửi email có liên kết đặt mật khẩu tới địa chỉ dưới đây. Người dùng chưa kích hoạt tài khoản."
      confirmVariant="solid"
      confirmLabel={error ? "Thử lại" : "Gửi lại email"}
      isLoading={isPending}
      onConfirm={onConfirm}
    >
      <UserIdentity name={nameOf(shown)} email={shown.email} />
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </ConfirmModal>
  );
}
