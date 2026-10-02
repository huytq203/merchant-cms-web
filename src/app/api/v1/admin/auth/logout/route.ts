import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIES } from "@/lib/auth/cookies";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIES.ACCESS_TOKEN);
  cookieStore.delete(AUTH_COOKIES.REFRESH_TOKEN);

  return new NextResponse(null, { status: 204 });
}
