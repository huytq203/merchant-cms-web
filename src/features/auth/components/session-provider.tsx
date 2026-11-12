"use client";

import * as React from "react";

import { hasPermission, type MerchantPermission } from "@/features/auth/permissions";
import type { SessionUser } from "@/types/auth";

const SessionContext = React.createContext<SessionUser | null>(null);

interface SessionProviderProps {
  session: SessionUser;
  children: React.ReactNode;
}

export function SessionProvider({ session, children }: SessionProviderProps) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionUser {
  const session = React.useContext(SessionContext);
  if (!session) throw new Error("useSession must be used within SessionProvider");
  return session;
}

/** Như `useSession` nhưng trả null ngoài provider — cho component dùng chung chỉ cần session để làm giàu giao diện. */
export function useOptionalSession(): SessionUser | null {
  return React.useContext(SessionContext);
}

export function useHasPermission(permission: MerchantPermission): boolean {
  return hasPermission(useSession().permissions, permission);
}
