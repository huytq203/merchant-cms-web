"use server";

import { fail, ok, type Result } from "@/lib/http/result";
import { loginSchema } from "@/features/auth/schemas";
import { authenticateUser, setAuthCookies } from "@/features/auth/services/auth-service";

import type { LoginInput } from "@/features/auth/schemas";

export type LoginActionResult = Result<{ redirectTo: string }>;

export async function loginAction(
  input: LoginInput,
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Dữ liệu không hợp lệ", "VALIDATION");
  }

  const res = await authenticateUser(parsed.data.username, parsed.data.password);

  if (!res) {
    return fail("Tên đăng nhập hoặc mật khẩu không đúng", "INVALID_CREDENTIALS");
  }

  await setAuthCookies(
    res.data.accessToken,
    res.data.refreshToken,
    res.data.expiresIn,
    res.data.refreshExpiresIn,
  );

  return ok({ redirectTo: "/dashboard" });
}
