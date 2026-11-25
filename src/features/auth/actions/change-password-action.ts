"use server";

import { setPasswordSchema } from "@/features/auth/schemas";
import { writeSessionCookies } from "@/lib/auth/session-cookies";
import { fail, ok, type Result } from "@/lib/http/result";
import {
  CHANGE_PASSWORD_EXPIRED_MESSAGE,
  CHANGE_PASSWORD_TICKET_INVALID,
} from "@/features/auth/utils/change-password-ticket";
import { changeFirstLoginPassword } from "@/server/modules/auth/merchant-auth.service";

/**
 * Replaces the temporary password using the ticket from the OTP step. Only a success sets cookies,
 * so a failed attempt never leaves a half-signed-in browser.
 */
export async function changeFirstLoginPasswordAction(input: {
  ticket: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<Result<{ redirectTo: string }>> {
  if (!input.ticket) return fail(CHANGE_PASSWORD_EXPIRED_MESSAGE, CHANGE_PASSWORD_TICKET_INVALID);
  const parsed = setPasswordSchema.safeParse({ newPassword: input.newPassword, confirmPassword: input.confirmPassword });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ", "VALIDATION");
  const result = await changeFirstLoginPassword({ ticket: input.ticket, ...parsed.data });
  if (!result.success) return fail(result.error.message, result.error.code);
  await writeSessionCookies(result.data);
  return ok({ redirectTo: "/dashboard" });
}
