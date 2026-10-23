import { usePathname, useRouter } from "next/navigation";
import type { NotificationFilter } from "../types";

/** The default "all" view leaves `unreadOnly` out of the URL so a plain `/notifications` link matches it. */
function toSearchParams(filter: NotificationFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.unreadOnly) params.set("unreadOnly", "true");
  params.set("page", String(filter.page));
  params.set("pageSize", String(filter.pageSize));
  return params;
}

/** Inbox filter and pagination live in the URL, so a refresh or shared link reopens the same view. */
export function useNotificationNavigation(filter: NotificationFilter) {
  const router = useRouter();
  const pathname = usePathname();
  const navigate = (next: NotificationFilter) => router.push(`${pathname}?${toSearchParams(next)}`);

  return {
    /** Switching the filter goes back to the first page; the old page may not exist in the new view. */
    setUnreadOnly: (unreadOnly: boolean) => navigate({ ...filter, unreadOnly, page: 1 }),
    changePage: (page: number, pageSize: number) => navigate({ ...filter, page, pageSize }),
  };
}
