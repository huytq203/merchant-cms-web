import { NextRequest, NextResponse } from "next/server";

import { authenticateUser, setAuthCookies } from "@/features/auth/services/auth-service";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };

  if (!body.username || !body.password) {
    return NextResponse.json(
      { message: "username và password là bắt buộc", success: false, status: "BAD_REQUEST", detail: "", data: null },
      { status: 400 },
    );
  }

  const res = await authenticateUser(body.username, body.password);

  if (!res) {
    return NextResponse.json(
      { message: "Tên đăng nhập hoặc mật khẩu không đúng", success: false, status: "UNAUTHORIZED", detail: "", data: null },
      { status: 401 },
    );
  }

  await setAuthCookies(
    res.data.accessToken,
    res.data.refreshToken,
    res.data.expiresIn,
    res.data.refreshExpiresIn,
  );

  return NextResponse.json(res);
}
