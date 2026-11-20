"use client";

import { Mail } from "lucide-react";
import { OtpEntry } from "@/components/form/OtpEntry";
import type { SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { UnconfirmedOrderNotice } from "./UnconfirmedOrderNotice";

type Props = {
  challenge: SensitiveOtpChallenge;
  /** Việc OTP đang xác nhận, ví dụ "lệnh chi hộ" hoặc "gửi lô chi hộ". */
  purpose: string;
  submitLabel: string;
  failure: string | null;
  /** Kết quả lần gửi trước chưa rõ: nhắc xin mã mới, giữ nguyên mã yêu cầu (đã khoá) và cho tra lại lệnh. */
  unconfirmed?: boolean;
  isSubmitting: boolean;
  isResending: boolean;
  onSubmit: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
  /** Chỉ lệnh đơn lẻ có: tra lại lệnh theo mã yêu cầu khi chưa xác nhận được kết quả. */
  onLookup?: () => void;
  isLookingUp?: boolean;
  /** Đã tra lại ít nhất một lần nên được chủ động bỏ lệnh chưa xác nhận. */
  canAbandon?: boolean;
  onAbandon?: () => void;
};

/** Bước nhập mã OTP gửi về email của người dùng; gửi mã là bước tạo lệnh/gửi lô thật. */
export function DisbursementOtpStep({
  challenge, purpose, submitLabel, failure, unconfirmed = false, isSubmitting, isResending, onSubmit, onResend, onBack, onLookup, isLookingUp = false, canAbandon = false, onAbandon,
}: Props) {
  return (
    <div className="mx-auto grid w-full max-w-md justify-items-center gap-3 py-2 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <Mail className="size-6" aria-hidden />
      </span>
      <p className="text-sm text-muted-foreground">
        {`Nhập mã 6 số đã gửi tới email ${challenge.maskedRecipient} để xác nhận ${purpose}.`}
      </p>
      {unconfirmed && onLookup ? (
        <UnconfirmedOrderNotice onLookup={onLookup} isLookingUp={isLookingUp} canAbandon={canAbandon} onAbandon={onAbandon ?? (() => {})} />
      ) : null}
      <div className="w-full text-left">
        <OtpEntry
          key={challenge.otpSessionId}
          challenge={challenge}
          isSubmitting={isSubmitting}
          isResending={isResending}
          failure={failure}
          notice={null}
          submitLabel={submitLabel}
          backLabel="Quay lại"
          onSubmit={onSubmit}
          onResend={onResend}
          onBack={onBack}
        />
      </div>
    </div>
  );
}
