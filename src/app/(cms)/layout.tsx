import { redirect } from "next/navigation";

import { CmsShell } from "@/components/shared/layout/cms-shell";
import { getServerSession } from "@/lib/auth/session";
import { siteConfig } from "@/config/site";

export default async function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();
  if (!user) redirect(siteConfig.routes.login);
  return <CmsShell user={user}>{children}</CmsShell>;
}
