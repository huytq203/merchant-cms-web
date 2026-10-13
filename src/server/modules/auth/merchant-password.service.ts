import "server-only";
import { z } from "zod";

import type { BeClient, BeResult } from "@/lib/be/client";
import { emptySchema } from "@/lib/be/envelope";
import { identityClient } from "@/lib/be/services";
import {
  otpChallengeSchema,
  type OtpChallenge,
} from "@/server/modules/auth/merchant-auth.dto";
import { MERCHANT_AUTH_PATH } from "@/server/modules/auth/merchant-auth.service";

/** Shown after a forgot-password request whether or not the email exists. */
export const FORGOT_PASSWORD_MESSAGE =
  "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu.";

const resetTokenSchema = z.object({
  valid: z.boolean(),
  maskedEmail: z.string().nullish(),
});

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export function changePassword(
  input: ChangePasswordInput,
  client: BeClient = identityClient(),
): Promise<BeResult<undefined>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/change-password`,
    body: input,
    schema: emptySchema,
  });
}

export function forgotPassword(
  email: string,
  client: BeClient = identityClient(),
): Promise<BeResult<undefined>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/forgot-password`,
    body: { email },
    schema: emptySchema,
    auth: false,
  });
}

export function validateResetToken(
  token: string,
  client: BeClient = identityClient(),
): Promise<BeResult<z.infer<typeof resetTokenSchema>>> {
  return client.get({
    path: `${MERCHANT_AUTH_PATH}/reset-password/validate`,
    query: { token },
    schema: resetTokenSchema,
    auth: false,
  });
}

export function requestResetOtp(
  input: ResetPasswordInput,
  client: BeClient = identityClient(),
): Promise<BeResult<OtpChallenge>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/reset-password`,
    body: input,
    schema: otpChallengeSchema,
    auth: false,
  });
}

export function confirmResetOtp(
  requestId: string,
  otp: string,
  client: BeClient = identityClient(),
): Promise<BeResult<undefined>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/reset-password/verify-otp`,
    body: { requestId, otp },
    schema: emptySchema,
    auth: false,
  });
}

export interface RetryResetPasswordInput {
  requestId: string;
  newPassword: string;
  confirmPassword: string;
}

/** Another password for a set-password session whose OTP was already accepted but whose password the policy rejected. */
export function retryResetPassword(
  input: RetryResetPasswordInput,
  client: BeClient = identityClient(),
): Promise<BeResult<undefined>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/reset-password/retry`,
    body: input,
    schema: emptySchema,
    auth: false,
  });
}
