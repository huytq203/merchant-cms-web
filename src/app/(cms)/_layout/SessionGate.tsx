import { redirect } from "next/navigation";

import { AccountStatusNotice } from "@/features/auth/components/account-status-notice";
import { SessionProvider } from "@/features/auth/components/session-provider";
import { SessionUnavailable } from "@/features/auth/components/session-unavailable";
import { getSessionState } from "@/lib/auth/session";

import { CmsShell } from "./CmsShell";

export async function SessionGate({ children }: { children: React.ReactNode }) {
  const state = await getSessionState();
  if (state.kind === "unauthenticated") redirect("/api/v1/admin/auth/session-expired");
  if (state.kind === "unavailable") return <SessionUnavailable />;
  return (
    <SessionProvider session={state.user}>
      {state.user.status === "ACTIVE" ? (
        <CmsShell>{children}</CmsShell>
      ) : (
        <AccountStatusNotice status={state.user.status} />
      )}
    </SessionProvider>
  );
}
