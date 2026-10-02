import { redirect } from "next/navigation";

import { AccountStatusNotice } from "@/features/auth/components/account-status-notice";
import { SessionProvider } from "@/features/auth/components/session-provider";
import { getServerSession } from "@/lib/auth/session";

import { CmsShell } from "./_layout/CmsShell";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  // A cookie the BE no longer accepts must be cleared first, or /login bounces back to /dashboard.
  if (!session) redirect("/api/v1/admin/auth/session-expired");

  return (
    <SessionProvider session={session}>
      {session.status === "ACTIVE" ? (
        <CmsShell>{children}</CmsShell>
      ) : (
        <AccountStatusNotice status={session.status} />
      )}
    </SessionProvider>
  );
}
