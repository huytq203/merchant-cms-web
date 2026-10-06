import { Suspense } from "react";

import { CmsShellSkeleton } from "./_layout/CmsShellSkeleton";
import { SessionGate } from "./_layout/SessionGate";

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<CmsShellSkeleton />}>
      <SessionGate>{children}</SessionGate>
    </Suspense>
  );
}
