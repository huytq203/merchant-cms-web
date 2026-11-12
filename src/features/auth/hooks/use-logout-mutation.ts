"use client";

import { useTransition } from "react";

import { logoutAction } from "@/features/auth/actions/logout-action";
import { unregisterPush } from "@/features/notifications/push/register-push";

/** Quá hạn này thì bỏ qua việc gỡ token push: FCM/mạng treo không được làm chậm đăng xuất. */
export const UNREGISTER_PUSH_TIMEOUT_MS = 3_000;

/** Gỡ token push nhưng không chờ quá `UNREGISTER_PUSH_TIMEOUT_MS`; lỗi hay quá hạn đều bỏ qua. */
function unregisterPushBounded(): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => { timer = setTimeout(resolve, UNREGISTER_PUSH_TIMEOUT_MS); });
  return Promise.race([unregisterPush().catch(() => undefined), timeout]).finally(() => clearTimeout(timer));
}

export function useLogoutMutation() {
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      // Gỡ token push trước: proxy cần access token, mà logoutAction sẽ xóa cookie phiên.
      await unregisterPushBounded();
      await logoutAction();
    });
  }

  return { logout, isPending };
}
