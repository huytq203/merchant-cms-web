"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Clock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button/Button";
import { InputOTP } from "@/components/ui/input-otp/InputOtp";
import { useCountdown } from "@/features/auth/hooks/use-countdown";

const OTP_LENGTH = 6;

export interface OtpPanelProps {
  maskedRecipient: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
  resendRemaining: number;
  isSubmitting: boolean;
  isResending: boolean;
  errorMessage: string | null;
  noticeMessage: string | null;
  onSubmit: (otp: string) => void;
  onResend: () => void;
}

function formatCountdown(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function OtpMessage({ errorMessage, noticeMessage, expired, resendRemaining }: Pick<OtpPanelProps, "errorMessage" | "noticeMessage" | "resendRemaining"> & { expired: boolean }) {
  const error = errorMessage ?? (expired
    ? "Mã đã hết hạn. Gửi lại mã mới để tiếp tục."
    : resendRemaining === 0
      ? "Bạn đã dùng hết lượt gửi lại. Hãy quay lại và đăng nhập lại để nhận mã mới."
      : null);
  const message = error ?? noticeMessage;
  if (!message) return null;
  return (
    <div className="min-w-0 text-sm">
      <div className={`flex items-start gap-2 ${error ? "text-danger" : "text-primary"}`} role={error ? "alert" : "status"}>
        {error ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />}
        <span>{message}</span>
      </div>
    </div>
  );
}

function OtpMeta({ expiryLeft, resendLeft, resendRemaining, isResending, onResend }: {
  expiryLeft: number;
  resendLeft: number;
  resendRemaining: number;
  isResending: boolean;
  onResend: () => void;
}) {
  const resendLabel = resendRemaining === 0
    ? "Đã hết lượt gửi lại"
    : resendLeft > 0
      ? `Gửi lại sau ${resendLeft} giây`
      : `Gửi lại mã (còn ${resendRemaining})`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
      <span className={`inline-flex items-center gap-1.5 ${expiryLeft === 0 ? "text-danger" : ""}`}>
        <Clock className="size-4 shrink-0" aria-hidden />
        {expiryLeft === 0 ? "Mã đã hết hạn" : <>Hết hạn sau <span className="tabular-nums">{formatCountdown(expiryLeft)}</span></>}
      </span>
      <Button type="button" variant="link" disabled={resendLeft !== 0 || resendRemaining === 0 || isResending} onClick={onResend}>
        {resendLabel}
      </Button>
    </div>
  );
}

export function OtpPanel(props: OtpPanelProps) {
  const { maskedRecipient, resendRemaining, isSubmitting, isResending, errorMessage, noticeMessage } = props;
  const [code, setCode] = React.useState("");
  const { secondsLeft: resendLeft } = useCountdown(props.resendAfterSeconds);
  const { secondsLeft: expiryLeft } = useCountdown(props.expiresInSeconds);
  const expired = expiryLeft === 0;

  function handlePasteCapture(event: React.ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\s/g, "");
    if (!/^\d{6}$/.test(pasted) || isSubmitting || expired) return;
    event.preventDefault();
    event.stopPropagation();
    setCode(pasted);
    props.onSubmit(pasted);
  }

  return (
    <section className="mx-auto grid w-full min-w-0 max-w-sm grid-cols-1 gap-5">
      <div className="grid gap-2">
        <h1 className="min-w-0 text-2xl font-bold tracking-tight text-foreground">Nhập mã xác thực</h1>
        <p className="text-sm text-muted-foreground">Chúng tôi đã gửi mã 6 số tới</p>
        <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-muted py-1 pl-2.5 pr-3 text-sm font-semibold text-foreground">
          <Mail className="size-4 shrink-0 text-primary" aria-hidden /><span className="truncate">{maskedRecipient}</span>
        </span>
      </div>

      <div className="grid min-w-0 gap-2">
        <div className="[&>div>p]:hidden" onPasteCapture={handlePasteCapture}>
          <InputOTP
            length={OTP_LENGTH}
            size="sm"
            separatorAfter={3}
            separator="dash"
            className="w-full gap-1.5"
            slotClassName="h-14 min-w-0 flex-1 max-w-[52px] text-2xl"
            value={code}
            onChange={setCode}
            error={Boolean(errorMessage) || expired}
            disabled={isSubmitting}
            autoFocus
          />
        </div>
        <OtpMessage errorMessage={errorMessage} noticeMessage={noticeMessage} expired={expired} resendRemaining={resendRemaining} />
      </div>
      <OtpMeta expiryLeft={expiryLeft} resendLeft={resendLeft} resendRemaining={resendRemaining} isResending={isResending} onResend={props.onResend} />
      <Button type="button" size="lg" className="w-full" isLoading={isSubmitting} disabled={code.length !== OTP_LENGTH || isSubmitting || expired} onClick={() => props.onSubmit(code)}>
        Xác nhận
      </Button>
      <p className="text-center text-xs text-muted-foreground">Không thấy email? Kiểm tra thư mục thư rác.</p>
    </section>
  );
}
