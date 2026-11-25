import { z } from "zod";

export const otpChallengeSchema = z.object({
  requestId: z.string().min(1),
  maskedRecipient: z.string(),
  /** Seconds until the OTP expires. */
  expiresIn: z.number(),
  /** Seconds until a resend is allowed. */
  canResendAfter: z.number(),
  resendRemaining: z.number(),
});

export const loginChallengeSchema = otpChallengeSchema.extend({ otpRequired: z.boolean() });

export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number(),
  refreshToken: z.string().min(1),
  refreshExpiresIn: z.number(),
});

/**
 * verify-otp for a user still on a temporary password: no tokens, only a one-time ticket that
 * first-login/change-password exchanges for them once a new password is chosen.
 */
export const mustChangePasswordSchema = z.object({
  mustChangePassword: z.literal(true),
  changePasswordTicket: z.string().min(1),
  ticketExpiresInSeconds: z.number(),
});

/** Tokens, or the change-password ticket instead; a `mustChangePassword` of false or absent is a normal login. */
export const verifyOtpResultSchema = z.union([mustChangePasswordSchema, tokenPairSchema]);

export type MustChangePassword = z.infer<typeof mustChangePasswordSchema>;
export type VerifyOtpResult = z.infer<typeof verifyOtpResultSchema>;

export function isMustChangePassword(result: VerifyOtpResult): result is MustChangePassword {
  return "mustChangePassword" in result && result.mustChangePassword === true;
}

export type OtpChallenge = z.infer<typeof otpChallengeSchema>;
export type LoginChallenge = z.infer<typeof loginChallengeSchema>;
export type TokenPair = z.infer<typeof tokenPairSchema>;
