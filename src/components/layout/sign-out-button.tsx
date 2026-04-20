"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/shared/ui/button";
import { useLogoutMutation } from "@/features/auth/hooks/use-logout-mutation";

export function SignOutButton() {
  const { logout, isPending } = useLogoutMutation();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={logout}
      disabled={isPending}
      aria-label="Đăng xuất"
    >
      <LogOut aria-hidden />
      <span className="hidden sm:inline">Đăng xuất</span>
    </Button>
  );
}
