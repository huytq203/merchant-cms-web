"use client";

import { useId, type ReactNode } from "react";
import { KeyRound, LockKeyhole, LockKeyholeOpen, Mail } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip/Tooltip";
import type { MerchantUser } from "../schemas/user.schema";
import { getLockBlock, getResetPasswordBlock } from "../utils/user-restrictions";
import { userStatusOf } from "../utils/user-view";

interface QuickButtonProps {
  label: string;
  icon: ReactNode;
  /** When set the button is disabled and the reason is exposed as tooltip and description. */
  reason?: string;
  onClick: () => void;
}

function QuickButton({ label, icon, reason, onClick }: QuickButtonProps) {
  const reasonId = useId();
  const button = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      leftIcon={icon}
      disabled={Boolean(reason)}
      aria-describedby={reason ? reasonId : undefined}
      onClick={onClick}
    >
      {label}
    </Button>
  );
  if (!reason) return button;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex">
            {button}
            <span id={reasonId} className="sr-only">{reason}</span>
          </span>
        }
      />
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}

interface Props {
  user: MerchantUser;
  actorId: string;
  onReset: () => void;
  onToggleLock: () => void;
}

export function UserQuickActions({ user, actorId, onReset, onToggleLock }: Props) {
  const status = userStatusOf(user);
  const isLocked = status === "LOCKED";
  const isPending = status === "PENDING";

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        <QuickButton
          label={isPending ? "Gửi lại kích hoạt" : "Đặt lại mật khẩu"}
          icon={isPending ? <Mail className="h-4 w-4" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
          reason={isPending ? undefined : getResetPasswordBlock(user, actorId)}
          onClick={onReset}
        />
        <QuickButton
          label={isLocked ? "Mở khóa" : "Khóa tài khoản"}
          icon={isLocked ? <LockKeyholeOpen className="h-4 w-4" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
          reason={getLockBlock(user, actorId)}
          onClick={onToggleLock}
        />
      </div>
    </TooltipProvider>
  );
}
