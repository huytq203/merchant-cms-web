"use client";

import { useState } from "react";
import { ApiError } from "@/lib/http/api-client";
import type { SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";

/** Fixed text for OTP failures: the BE forwards the identity wording, which may not be Vietnamese. */
export function describeRefundError(error: unknown): string {
  if (!(error instanceof ApiError)) return "Không thực hiện được, vui lòng thử lại.";
  if (error.code === "MERCHANT_SENSITIVE_OTP_INVALID") return "Mã OTP không đúng hoặc đã hết hạn. Hãy kiểm tra lại hoặc gửi lại mã.";
  if (error.code === "MERCHANT_SENSITIVE_OTP_REQUIRED") return "Vui lòng nhập mã OTP để xác nhận.";
  if (error.code === "MERCHANT_SENSITIVE_OTP_ISSUE_FAILED") return "Không gửi được mã OTP, vui lòng thử lại sau.";
  return error.message;
}

/** The challenge, the last failure and the send/resend calls shared by creating and approving a refund. */
export function useRefundOtpStep(requestCode: () => Promise<SensitiveOtpChallenge>) {
  const [challenge, setChallenge] = useState<SensitiveOtpChallenge | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const send = async (): Promise<boolean> => {
    setFailure(null);
    setIsRequesting(true);
    try {
      setChallenge(await requestCode());
      return true;
    } catch (error) {
      setFailure(describeRefundError(error));
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  const reset = () => {
    setChallenge(null);
    setFailure(null);
  };

  return { challenge, failure, setFailure, isRequesting, send, reset };
}
