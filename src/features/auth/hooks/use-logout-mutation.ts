"use client";

import { useTransition } from "react";

import { logoutAction } from "@/features/auth/actions/logout-action";

export function useLogoutMutation() {
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(() => {
      void logoutAction();
    });
  }

  return { logout, isPending };
}
