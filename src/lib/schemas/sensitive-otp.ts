import { z } from "zod";

/** What the BE returns when it sends an email OTP for a sensitive operation. */
export const sensitiveOtpChallengeSchema = z.object({
  otpSessionId: z.string().min(1),
  maskedRecipient: z.string(),
  expiresInSeconds: z.number().nonnegative(),
  canResendAfterSeconds: z.number().nonnegative(),
});

export type SensitiveOtpChallenge = z.infer<typeof sensitiveOtpChallengeSchema>;

/** The answer to a challenge, sent inside the request it authorises. */
export type SensitiveOtp = { otpSessionId: string; otp: string };

export const OTP_LENGTH = 6;

/** A confirmation is accepted only when both halves are present; half of one never reaches the BE. */
export const sensitiveOtpSchema = z.object({
  otpSessionId: z.string().trim().min(1, "Phiên OTP không hợp lệ"),
  otp: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Mã OTP gồm ${OTP_LENGTH} chữ số`),
});
