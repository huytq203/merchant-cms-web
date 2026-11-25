"use client";

import { Info, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { usePreservedValue } from "@/lib/hooks/use-preserved-value";
import type { SessionMerchant } from "@/types/auth";
import type { MerchantUser } from "../schemas/user.schema";
import { merchantScopeLabel, merchantScopeNames } from "../utils/user-mapper";
import { getResetPasswordBlock } from "../utils/user-restrictions";
import { UserIdentity } from "./UserIdentity";
import { nameOf, userStatusOf } from "../utils/user-view";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MerchantUser | null;
  actorId: string;
  /** Code and name of the caller's merchants, to show the user's Merchant by name. */
  merchants?: SessionMerchant[];
  isPending: boolean;
  error?: string;
  onConfirm: () => void;
}

const resetFailureMessage = "Chưa gửi được yêu cầu. Hệ thống đang gặp sự cố, thử lại sau ít phút.";

/** What confirming does, by status: an active user gets a temporary password, a pending one the activation mail again. */
function describeReset(user: MerchantUser): string {
  if (userStatusOf(user) === "PENDING") return `Hệ thống sẽ gửi lại email kích hoạt tới ${user.email}.`;
  return `Hệ thống sẽ tạo mật khẩu tạm (hiệu lực 24 giờ) và gửi tới email ${user.email}. User phải đổi mật khẩu ở lần đăng nhập đầu tiên. Mọi phiên đăng nhập hiện tại của User sẽ bị đăng xuất.`;
}

function Banner({ tone, role, children }: { tone: "warn" | "error"; role: "alert" | "status"; children: ReactNode }) {
  const toneClass = { warn: "bg-warning-soft text-warning", error: "bg-danger-soft text-danger" }[tone];
  return <div role={role} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${toneClass}`}>{children}</div>;
}

function MerchantLine({ user, merchants }: { user: MerchantUser; merchants: SessionMerchant[] }) {
  if (user.merchantIds.length === 0) return null;
  const names = merchantScopeNames(user.merchantIds, merchants);
  return (
    <p className="mt-2 text-xs text-muted-foreground">
      Merchant: <span className="font-medium text-foreground">{names ? names.join(", ") : merchantScopeLabel(user.merchantIds)}</span>
    </p>
  );
}

function ResetBody({ user, merchants, blocked, error }: { user: MerchantUser; merchants: SessionMerchant[]; blocked?: string; error?: string }) {
  return (
    <>
      <div className="rounded-xl border border-border bg-page px-3.5 py-3">
        <UserIdentity name={nameOf(user)} email={user.email} />
        <MerchantLine user={user} merchants={merchants} />
      </div>
      {blocked ? (
        <Banner tone="warn" role="alert"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{blocked}</span></Banner>
      ) : (
        <p className="grid grid-cols-[auto_1fr] gap-2.5 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
          <span>{describeReset(user)}</span>
        </p>
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

/**
 * Confirmation only: the result arrives as a toast and the dialog closes on success. A failure keeps
 * it open with a retry. Needs no OTP and no input.
 */
export function UserResetPasswordDialog({ open, onOpenChange, user, actorId, merchants = [], isPending, error, onConfirm }: Props) {
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
      confirmLabel={confirmLabel({ isPending, error })}
      confirmDisabled={Boolean(blocked)}
      isLoading={isPending}
      onConfirm={onConfirm}
    >
      <ResetBody user={shown} merchants={merchants} blocked={blocked} error={error} />
    </ConfirmModal>
  );
}
