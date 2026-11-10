import { usePathname, useRouter } from "next/navigation";
import type { UserFilter } from "../user-queries";

type SearchValues = Pick<UserFilter, "query" | "status" | "merchantId" | "permissionGroupId" | "scope">;

function toSearchParams(filter: UserFilter): URLSearchParams {
  const params = new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
  if (filter.query) params.set("query", filter.query);
  if (filter.status) params.set("status", filter.status);
  if (filter.merchantId) params.set("merchantId", filter.merchantId);
  if (filter.permissionGroupId) params.set("permissionGroupId", filter.permissionGroupId);
  if (filter.scope) params.set("scope", filter.scope);
  return params;
}

export function useUserListNavigation(filter: UserFilter) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (next: UserFilter) => {
    router.push(`${pathname}?${toSearchParams(next)}`);
  };
  const search = (values: SearchValues) => {
    navigate({ page: 1, pageSize: filter.pageSize, ...values });
  };
  const changePage = (page: number, pageSize: number) => {
    navigate({ ...filter, page, pageSize });
  };

  return { search, changePage };
}
