"use client";

import { Check, Info, Mail, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { usePreservedValue } from "@/lib/hooks/use-preserved-value";
import type { MerchantUser } from "../schemas/user.schema";
import { getResetPasswordBlock } from "../utils/user-restrictions";
import { UserIdentity } from "./UserIdentity";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MerchantUser | null;
  actorId: string;
  isPending: boolean;
  isSuccess: boolean;
  error?: string;
  onConfirm: () => void;
}

const steps = [
  { icon: Mail, text: "Hệ thống gửi liên kết đặt lại mật khẩu tới email của người dùng." },
  { icon: ShieldCheck, text: "Bạn không nhìn thấy mật khẩu mới. Thao tác được ghi vào nhật ký hệ thống." },
];

const resetFailureMessage = "Chưa gửi được yêu cầu. Hệ thống đang gặp sự cố, thử lại sau ít phút.";

function Banner({ tone, role, children }: { tone: "warn" | "ok" | "error"; role: "alert" | "status"; children: ReactNode }) {
  const toneClass = { warn: "bg-warning-soft text-warning", ok: "bg-success-soft text-success", error: "bg-danger-soft text-danger" }[tone];
  return <div role={role} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${toneClass}`}>{children}</div>;
}

function ResetBody({ user, blocked, error }: { user: MerchantUser; blocked?: string; error?: string }) {
  return (
    <>
      <div className="rounded-xl border border-border bg-page px-3.5 py-3">
        <UserIdentity name={user.fullName} email={user.email} />
      </div>
      {blocked ? (
        <Banner tone="warn" role="alert"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{blocked}</span></Banner>
      ) : (
        <ul className="grid gap-2 text-sm text-muted-foreground">
          {steps.map(({ icon: Icon, text }) => (
            <li key={text} className="grid grid-cols-[auto_1fr] gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <Banner tone="error" role="alert">
          <span>{resetFailureMessage}</span>
        </Banner>
      ) : null}
    </>
  );
}

function confirmLabel({ isPending, error }: Pick<Props, "isPending" | "error">): string {
  if (isPending) return "Đang gửi";
  return error ? "Thử lại" : "Đặt lại mật khẩu";
}

export function UserResetPasswordDialog({ open, onOpenChange, user, actorId, isPending, isSuccess, error, onConfirm }: Props) {
  const shown = usePreservedValue(user);
  if (!shown) return null;
  const blocked = getResetPasswordBlock(shown, actorId);

  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      title="Đặt lại mật khẩu"
      description=""
      confirmVariant="solid"
      confirmLabel={isSuccess ? "Xong" : confirmLabel({ isPending, error })}
      confirmDisabled={!isSuccess && Boolean(blocked)}
      hideCancel={isSuccess}
      isLoading={isPending}
      onConfirm={isSuccess ? () => onOpenChange(false) : onConfirm}
    >
      {isSuccess ? (
        <Banner tone="ok" role="status">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Đã gửi yêu cầu đặt lại mật khẩu</span>
        </Banner>
      ) : (
        <ResetBody user={shown} blocked={blocked} error={error} />
      )}
    </ConfirmModal>
  );
}
