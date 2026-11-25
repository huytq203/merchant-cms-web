"use server";

import { loginSchema, otpSchema, type LoginInput } from "@/features/auth/schemas";
import { writeSessionCookies } from "@/lib/auth/session-cookies";
import { fail, ok, type Result } from "@/lib/http/result";
import { isMustChangePassword, type OtpChallenge } from "@/server/modules/auth/merchant-auth.dto";
import { requestLoginOtp, resendOtp, verifyLoginOtp } from "@/server/modules/auth/merchant-auth.service";

export type OtpChallengeView = {
  requestId: string;
  maskedRecipient: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
  resendRemaining: number;
};

const DEFAULT_REDIRECT = "/dashboard";

function toView(challenge: OtpChallenge): OtpChallengeView {
  return {
    requestId: challenge.requestId,
    maskedRecipient: challenge.maskedRecipient,
    expiresInSeconds: challenge.expiresIn,
    resendAfterSeconds: challenge.canResendAfter,
    resendRemaining: challenge.resendRemaining,
  };
}

/** Step 1: password check, emails an OTP. Sets no cookies. */
export async function loginAction(input: LoginInput): Promise<Result<OtpChallengeView>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ", "VALIDATION");
  }
  const result = await requestLoginOtp(parsed.data.email, parsed.data.password);
  if (!result.success) return fail(result.error.message, result.error.code);
  if (!result.data.otpRequired) {
    return fail("Không thể bắt đầu xác thực OTP, vui lòng thử lại", "OTP_NOT_REQUIRED");
  }
  return ok(toView(result.data));
}

/** What a correct OTP leads to: a session, or the forced change of a temporary password first. */
export type VerifyOtpOutcome =
  | { mustChangePassword: false; redirectTo: string }
  | { mustChangePassword: true; ticket: string; ticketExpiresInSeconds: number };

/**
 * Step 2: a correct OTP yields tokens, stored in HTTP-only cookies. While the password is temporary
 * no cookie is set: the one-time ticket goes to the page, which spends it on the change-password step.
 */
export async function verifyLoginOtpAction(input: { requestId: string; otp: string }): Promise<Result<VerifyOtpOutcome>> {
  const parsed = otpSchema.safeParse({ otp: input.otp });
  if (!parsed.success || !input.requestId) {
    return fail(parsed.success ? "Phiên xác thực không hợp lệ" : "Mã OTP gồm 6 chữ số", "VALIDATION");
  }
  const result = await verifyLoginOtp(input.requestId, parsed.data.otp);
  if (!result.success) return fail(result.error.message, result.error.code);
  if (isMustChangePassword(result.data)) {
    return ok({
      mustChangePassword: true,
      ticket: result.data.changePasswordTicket,
      ticketExpiresInSeconds: result.data.ticketExpiresInSeconds,
    });
  }
  await writeSessionCookies(result.data);
  return ok({ mustChangePassword: false, redirectTo: DEFAULT_REDIRECT });
}

export async function resendLoginOtpAction(input: { requestId: string }): Promise<Result<OtpChallengeView>> {
  if (!input.requestId) return fail("Phiên xác thực không hợp lệ", "VALIDATION");
  const result = await resendOtp(input.requestId);
  return result.success ? ok(toView(result.data)) : fail(result.error.message, result.error.code);
}
