import { z } from "zod";

/** Mirrors the BE password rule (10–128 chars, upper, lower, digit, one of @$!%*?&, no other characters). */
export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

const emailField = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập email")
  .pipe(z.email("Email không hợp lệ"))
  .transform((value) => value.toLowerCase());

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .max(128, "Mật khẩu tối đa 128 ký tự"),
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Mã OTP gồm 6 chữ số"),
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const newPasswordSchema = z
  .string()
  .min(10, "Mật khẩu tối thiểu 10 ký tự")
  .max(128, "Mật khẩu tối đa 128 ký tự")
  .regex(
    PASSWORD_RULE,
    "Mật khẩu cần chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&), không dùng ký tự khác",
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const meResponseSchema = z.object({
  merchantUserId: z.string(),
  email: z.string().nullish(),
  fullName: z.string().nullish(),
  status: z.enum(["PENDING", "ACTIVE", "LOCKED"]).catch("LOCKED"),
  merchantIds: z.array(z.string()),
  subMerchantIds: z.array(z.string()),
  /** Only sent for a Sub-only session: the Masters its Subs sit under. */
  parentMerchantIds: z.array(z.string()).default([]),
  permissions: z.array(z.string()),
  authorizationVersion: z.number(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
