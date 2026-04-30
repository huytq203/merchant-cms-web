import { NextResponse } from "next/server";
import { refreshUserSession } from "@/lib/auth/services/auth-service";

export async function POST() {
  const session = await refreshUserSession();

  if (!session) {
    return NextResponse.json(
      { message: "Refresh token không hợp lệ hoặc đã hết hạn" },
      { status: 401 },
    );
  }

  return NextResponse.json(session);
}
