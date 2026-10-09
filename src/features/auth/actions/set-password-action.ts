"use server";

import { otpSchema, setPasswordSchema, type SetPasswordInput } from "@/features/auth/schemas";
import { fail, ok, type Result } from "@/lib/http/result";
import { confirmResetOtp, requestResetOtp, validateResetToken } from "@/server/modules/auth/merchant-password.service";
import { resendOtp } from "@/server/modules/auth/merchant-auth.service";
import type { OtpChallengeView } from "./login-action";

/** What the page needs to know about the link before it shows a form. */
export type SetPasswordLink = { valid: false } | { valid: true; maskedEmail: string | null };

export async function checkSetPasswordLink(token: string): Promise<SetPasswordLink> {
  if (!token) return { valid: false };
  const result = await validateResetToken(token);
  if (!result.success || !result.data.valid) return { valid: false };
  return { valid: true, maskedEmail: result.data.maskedEmail ?? null };
}

/** Step 1: the link and the new password are checked, then an OTP is emailed. Nothing is changed yet. */
export async function requestSetPasswordOtpAction(
  input: SetPasswordInput & { token: string },
): Promise<Result<OtpChallengeView>> {
  const parsed = setPasswordSchema.safeParse({ newPassword: input.newPassword, confirmPassword: input.confirmPassword });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ", "VALIDATION");
  if (!input.token) return fail("Liên kết không hợp lệ", "VALIDATION");
  const result = await requestResetOtp({ token: input.token, ...parsed.data });
  if (!result.success) return fail(result.error.message, result.error.code);
  const challenge = result.data;
  return ok({
    requestId: challenge.requestId,
    maskedRecipient: challenge.maskedRecipient,
    expiresInSeconds: challenge.expiresIn,
    resendAfterSeconds: challenge.canResendAfter,
    resendRemaining: challenge.resendRemaining,
  });
}

/** Step 2: a correct OTP applies the password and uses the link up. */
export async function confirmSetPasswordOtpAction(input: { requestId: string; otp: string }): Promise<Result<true>> {
  const parsed = otpSchema.safeParse({ otp: input.otp });
  if (!parsed.success || !input.requestId) {
    return fail(parsed.success ? "Phiên xác thực không hợp lệ" : "Mã OTP gồm 6 chữ số", "VALIDATION");
  }
  const result = await confirmResetOtp(input.requestId, parsed.data.otp);
  return result.success ? ok(true) : fail(result.error.message, result.error.code);
}

export async function resendSetPasswordOtpAction(input: { requestId: string }): Promise<Result<OtpChallengeView>> {
  if (!input.requestId) return fail("Phiên xác thực không hợp lệ", "VALIDATION");
  const result = await resendOtp(input.requestId);
  if (!result.success) return fail(result.error.message, result.error.code);
  const challenge = result.data;
  return ok({
    requestId: challenge.requestId,
    maskedRecipient: challenge.maskedRecipient,
    expiresInSeconds: challenge.expiresIn,
    resendAfterSeconds: challenge.canResendAfter,
    resendRemaining: challenge.resendRemaining,
  });
}
