"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIES } from "@/lib/auth/cookies";
import { createAuthClient } from "@/lib/http/server-client";

export async function logoutAction(): Promise<void> {
  try {
    const client = await createAuthClient();
    await client.post("/v1/admin/auth/logout");
  } catch {
    // Không block logout nếu BE call thất bại — vẫn xoá cookie local
  }

  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIES.ACCESS_TOKEN);
  cookieStore.delete(AUTH_COOKIES.REFRESH_TOKEN);

  redirect("/login");
}
