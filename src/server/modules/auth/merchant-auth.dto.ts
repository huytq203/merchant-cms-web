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

export type OtpChallenge = z.infer<typeof otpChallengeSchema>;
export type LoginChallenge = z.infer<typeof loginChallengeSchema>;
export type TokenPair = z.infer<typeof tokenPairSchema>;
