import { NextResponse } from "next/server";

import { clearSessionCookies, readRefreshToken, writeSessionCookies } from "@/lib/auth/session-cookies";
import { toHttpStatus } from "@/lib/be/errors";
import { refreshTokensOnce } from "@/server/modules/auth/merchant-auth.service";

export async function POST() {
  const refreshToken = await readRefreshToken();
  if (!refreshToken) {
    await clearSessionCookies();
    return NextResponse.json({ message: "Phiên đăng nhập đã hết hạn" }, { status: 401 });
  }
  const result = await refreshTokensOnce(refreshToken);
  if (!result.success) {
    await clearSessionCookies();
    return NextResponse.json({ message: result.error.message }, { status: toHttpStatus(result.error) === 502 ? 502 : 401 });
  }
  await writeSessionCookies(result.data);
  return NextResponse.json({ success: true });
}
