import { usePathname, useRouter } from "next/navigation";
import { toRefundSearchParams } from "../refund-queries";
import type { RefundListFilter } from "../types/type";

/** The URL is the source of truth for filter and pagination. */
export function useRefundListNavigation(filter: RefundListFilter) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (next: RefundListFilter) => {
    router.push(`${pathname}?${toRefundSearchParams(next)}`);
  };
  const changePage = (page: number, pageSize: number) => {
    navigate({ ...filter, page, pageSize });
  };

  return { search: navigate, changePage };
}
