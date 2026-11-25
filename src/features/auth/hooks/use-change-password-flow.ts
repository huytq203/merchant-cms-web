"use client";

import * as React from "react";
import type { Route } from "next";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { changeFirstLoginPasswordAction } from "@/features/auth/actions/change-password-action";
import type { SetPasswordInput } from "@/features/auth/schemas";
import {
  CHANGE_PASSWORD_EXPIRED_URL,
  CHANGE_PASSWORD_TICKET_INVALID,
  PASSWORD_CHANGED_MESSAGE,
  PASSWORD_CHANGED_URL,
  clearChangePasswordTicket,
  readChangePasswordTicket,
} from "@/features/auth/utils/change-password-ticket";

const subscribeNever = () => () => undefined;

/**
 * State of the forced password change: reads the ticket the login step stored, spends it on submit,
 * and sends the user back to the login page the moment the ticket is missing, expired or refused.
 */
export function useChangePasswordFlow() {
  const router = useRouter();
  // The ticket lives in sessionStorage, which the server render cannot see: it reads as "no ticket" there.
  const hasTicket = React.useSyncExternalStore(subscribeNever, () => readChangePasswordTicket() !== null, () => false);
  const [error, setError] = React.useState<string | null>(null);

  const backToLogin = React.useCallback(() => {
    clearChangePasswordTicket();
    router.replace(CHANGE_PASSWORD_EXPIRED_URL as Route);
  }, [router]);

  // Without a ticket there is nothing to do here; with one, leave the moment it expires.
  React.useEffect(() => {
    const found = readChangePasswordTicket();
    if (!found) return backToLogin();
    const timer = window.setTimeout(backToLogin, Math.max(found.expiresAt - Date.now(), 0));
    return () => window.clearTimeout(timer);
  }, [backToLogin]);

  const change = useMutation({
    mutationFn: (input: SetPasswordInput & { ticket: string }) => changeFirstLoginPasswordAction(input),
  });

  async function submit(values: SetPasswordInput) {
    // Re-read so a ticket that expired while the user was typing is not sent.
    const current = readChangePasswordTicket();
    if (!current) return backToLogin();
    setError(null);
    let result: Awaited<ReturnType<typeof changeFirstLoginPasswordAction>>;
    try {
      result = await change.mutateAsync({ ...values, ticket: current.ticket });
    } catch {
      // The ticket was not spent (the request never got an answer), so the form stays for another try.
      return setError("Không đổi được mật khẩu, vui lòng thử lại.");
    }
    if (result.success) {
      clearChangePasswordTicket();
      router.replace(result.data.redirectTo as Route);
      router.refresh();
      return;
    }
    if (result.code === CHANGE_PASSWORD_TICKET_INVALID) return backToLogin();
    if (result.error === PASSWORD_CHANGED_MESSAGE) {
      // Password changed, but no tokens were issued: the ticket is spent, so sign in again with the new password.
      clearChangePasswordTicket();
      router.replace(PASSWORD_CHANGED_URL as Route);
      return;
    }
    setError(result.error);
  }

  return { ready: hasTicket, error, isSubmitting: change.isPending, submit, backToLogin };
}
