import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIES, COOKIE_OPTIONS } from "@/lib/auth/cookies";
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

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };
  const user = MOCK_USERS.find(
    (u) => u.username === body.username && u.password === body.password,
  );

  if (!user) {
    return NextResponse.json(
      {
        message: "Email hoặc mật khẩu không đúng",
        success: false,
        status: "UNAUTHORIZED",
        detail: "",
        data: null,
      },
      { status: 401 },
    );
  }

  const expiresIn = 60 * 60 * 24;
  const refreshExpiresIn = 60 * 60 * 24 * 7;
  const accessToken = createMockJwt(user.username, expiresIn);
  const refreshToken = createMockJwt(user.username, refreshExpiresIn);

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIES.ACCESS_TOKEN, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: expiresIn,
  });
  cookieStore.set(AUTH_COOKIES.REFRESH_TOKEN, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: refreshExpiresIn,
  });

  const response: BeLoginResponse = {
    data: {
      accessToken,
      expiresIn,
      refreshToken,
      refreshExpiresIn,
    },
    message: "Đăng nhập thành công",
    detail: "",
    success: true,
    status: "OK",
  };

  return NextResponse.json(response);
}
