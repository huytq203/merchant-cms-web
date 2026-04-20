import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/session";
import { siteConfig } from "@/config/site";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();
  if (user) redirect(siteConfig.routes.dashboard);

  return <>{children}</>;
}
