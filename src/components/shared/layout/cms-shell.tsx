import * as React from "react";

import { AppHeader } from "@/components/shared/layout/app-header";
import { AppSidebar } from "@/components/shared/layout/app-sidebar";

import type { SessionUser } from "@/types/auth";

type CmsShellProps = {
  user: SessionUser;
  children: React.ReactNode;
};

export function CmsShell({ user, children }: CmsShellProps) {
  return (
    <div className="flex min-h-dvh bg-muted/30">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
