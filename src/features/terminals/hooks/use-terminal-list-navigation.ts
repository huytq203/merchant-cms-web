import { usePathname, useRouter } from "next/navigation";
import type { TerminalListFilter } from "../types";

type SearchValues = Pick<TerminalListFilter, "name" | "status" | "subMerchantId" | "terminalType">;

function toSearchParams(filter: TerminalListFilter): URLSearchParams {
  const params = new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
  if (filter.name) params.set("name", filter.name);
  if (filter.status) params.set("status", filter.status);
  if (filter.subMerchantId) params.set("subMerchantId", filter.subMerchantId);
  if (filter.terminalType) params.set("terminalType", filter.terminalType);
  return params;
}

export function useTerminalListNavigation(filter: TerminalListFilter) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (next: TerminalListFilter) => {
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
