import { usePathname, useRouter } from "next/navigation";
import { toOrderSearchParams } from "../order-queries";
import type { OrderListFilter } from "../types/types";

export function useOrderListNavigation(filter: OrderListFilter) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (next: OrderListFilter) => {
    router.push(`${pathname}?${toOrderSearchParams(next)}`);
  };
  const search = (values: Pick<OrderListFilter, "orderCode" | "status">) => {
    navigate({ page: 1, pageSize: filter.pageSize, ...values });
  };
  const changePage = (page: number, pageSize: number) => {
    navigate({ ...filter, page, pageSize });
  };

  return { search, changePage };
}
