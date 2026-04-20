import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/session";
import { siteConfig } from "@/config/site";

export default async function RootPage() {
  const user = await getServerSession();
  redirect(user ? siteConfig.routes.dashboard : siteConfig.routes.login);
}
