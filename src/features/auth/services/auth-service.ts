"server-only";

import { AUTH_COOKIES, COOKIE_OPTIONS } from "@/lib/auth/cookies";
import { cookies } from "next/headers";
import type { BeLoginResponse } from "@/types/auth";

const MOCK_USERS = [
  { username: "a", password: "123456" },
  { username: "b", password: "123456" },
];

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function createMockJwt(username: string, expiresIn: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: "HS256", typ: "JWT" });
  const payload = base64url({
    sid: `mock-sid-${username}`,
    preferred_username: username,
    roles: ["SUPER_ADMIN"],
    permissions: ["*"],
    exp: now + expiresIn,
    iat: now,
    jti: `mock-jti-${Date.now()}`,
  });
  return `${header}.${payload}.mock-signature`;
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<BeLoginResponse | null> {
  const user = MOCK_USERS.find(
    (u) => u.username === username && u.password === password,
  );
  if (!user) return null;

  const expiresIn = 60 * 60 * 24;
  const refreshExpiresIn = 60 * 60 * 24 * 7;

  return {
    data: {
      accessToken: createMockJwt(user.username, expiresIn),
      expiresIn,
      refreshToken: createMockJwt(user.username, refreshExpiresIn),
      refreshExpiresIn,
    },
    message: "Đăng nhập thành công",
    detail: "",
    success: true,
    status: "OK",
  };
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  refreshExpiresIn: number,
): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIES.ACCESS_TOKEN, accessToken, {
    ...COOKIE_OPTIONS,
    secure: isProduction,
    maxAge: expiresIn,
  });
  cookieStore.set(AUTH_COOKIES.REFRESH_TOKEN, refreshToken, {
    ...COOKIE_OPTIONS,
    secure: isProduction,
    maxAge: refreshExpiresIn,
  });
}
