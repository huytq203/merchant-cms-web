"use client";

import { useTransition } from "react";

import { logoutAction } from "@/features/auth/actions/logout-action";
import { unregisterPush } from "@/features/notifications/push/register-push";

export function useLogoutMutation() {
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      // Gỡ token push trước: proxy cần access token, mà logoutAction sẽ xóa cookie phiên.
      await unregisterPush().catch(() => undefined);
      await logoutAction();
    });
  }

  return { logout, isPending };
}
