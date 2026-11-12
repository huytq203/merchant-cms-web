import { usePathname, useRouter } from "next/navigation";
import { formatSubMerchantIds } from "@/features/sub-merchants/utils/sub-merchant-ids";
import type { TerminalListFilter } from "../types";

type SearchValues = Pick<TerminalListFilter, "name" | "status" | "subMerchantIds" | "terminalType">;

function toSearchParams(filter: TerminalListFilter): URLSearchParams {
  const params = new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
  if (filter.name) params.set("name", filter.name);
  if (filter.status) params.set("status", filter.status);
  const subMerchantIds = formatSubMerchantIds(filter.subMerchantIds);
  if (subMerchantIds) params.set("subMerchantIds", subMerchantIds);
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
