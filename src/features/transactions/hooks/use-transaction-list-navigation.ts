import { usePathname, useRouter } from "next/navigation";
import { toTransactionSearchParams } from "../transaction-queries";
import type { TransactionListFilter } from "../types";

/** The URL is the source of truth for filter and pagination. */
export function useTransactionListNavigation(filter: TransactionListFilter) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (next: TransactionListFilter) => {
    router.push(`${pathname}?${toTransactionSearchParams(next)}`);
  };
  const changePage = (page: number, pageSize: number) => {
    navigate({ ...filter, page, pageSize });
  };

  return { search: navigate, changePage };
}
