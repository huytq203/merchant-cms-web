"use server";

import { cookies } from "next/headers";

import { AUTH_COOKIES, COOKIE_OPTIONS } from "@/lib/auth/cookies";
import { apiClient, ApiError } from "@/lib/http/api-client";
import { fail, ok, type Result } from "@/lib/http/result";
import { loginSchema } from "@/features/auth/schemas";

import type { BeLoginResponse } from "@/types/auth";
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

  try {
    const res = await apiClient.post<BeLoginResponse>(
      "/v1/admin/auth/login",
      parsed.data,
    );

    if (!res.success || !res.data?.accessToken) {
      console.log(res);
      return fail(res.message ?? "Đăng nhập thất bại", "UNAUTHORIZED");
    }

    const isProduction = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();

    cookieStore.set(AUTH_COOKIES.ACCESS_TOKEN, res.data.accessToken, {
      ...COOKIE_OPTIONS,
      secure: isProduction,
      maxAge: res.data.expiresIn,
    });

    cookieStore.set(AUTH_COOKIES.REFRESH_TOKEN, res.data.refreshToken, {
      ...COOKIE_OPTIONS,
      secure: isProduction,
      maxAge: res.data.refreshExpiresIn,
    });

    return ok({ redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 400) {
        return fail(
          err.message || "Tên đăng nhập hoặc mật khẩu không đúng",
          "INVALID_CREDENTIALS",
        );
      }
      return fail(err.message || "Đăng nhập thất bại", "API_ERROR");
    }
    console.error("[loginAction]", err);
    return fail("Lỗi máy chủ, vui lòng thử lại sau.", "SERVER_ERROR");
  }
}
