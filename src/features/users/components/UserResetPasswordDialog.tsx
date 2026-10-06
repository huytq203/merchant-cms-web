"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { useState } from "react";
import type { ResetPasswordOtp } from "../hooks/use-user-actions";
import type { MerchantUser } from "../schemas/user.schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MerchantUser | null;
  isPending: boolean;
  error?: string;
  onConfirm: (otp: ResetPasswordOtp) => void;
}

export function UserResetPasswordDialog({ open, onOpenChange, user, isPending, error, onConfirm }: Props) {
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otp, setOtp] = useState("");
  const canConfirm = otpSessionId.trim().length > 0 && otp.trim().length > 0 && !isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          <DialogDescription>
            Đặt lại mật khẩu cho {user?.fullName}. Hệ thống không hiển thị mật khẩu mới.
          </DialogDescription>
        </DialogHeader>
        <Input
          label="Mã phiên OTP"
          placeholder="Nhập mã phiên OTP"
          value={otpSessionId}
          onChange={(event) => setOtpSessionId(event.target.value)}
        />
        <Input
          label="Mã OTP"
          placeholder="Nhập mã OTP"
          value={otp}
          inputMode="numeric"
          onChange={(event) => setOtp(event.target.value)}
        />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            type="button"
            variant="solid"
            disabled={!canConfirm}
            onClick={() => onConfirm({ otpSessionId: otpSessionId.trim(), otp: otp.trim() })}
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
