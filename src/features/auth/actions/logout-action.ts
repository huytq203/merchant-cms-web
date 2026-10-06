"use server";

import { redirect } from "next/navigation";

import { clearSessionCookies, readRefreshToken } from "@/lib/auth/session-cookies";
import { logoutSession } from "@/server/modules/auth/merchant-auth.service";

export async function logoutAction(): Promise<void> {
  const refreshToken = await readRefreshToken();
  if (refreshToken) {
    // A BE failure must not block signing out locally.
    await logoutSession(refreshToken);
  }
  await clearSessionCookies();
  redirect("/login");
}
