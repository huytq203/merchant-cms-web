import { usePathname, useRouter } from "next/navigation";
import { toWithdrawalSearchParams } from "../withdrawal-queries";
import type { WithdrawalListFilter } from "../types/types";

export function useWithdrawalListNavigation(filter: WithdrawalListFilter) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (next: WithdrawalListFilter) => {
    router.push(`${pathname}?${toWithdrawalSearchParams(next)}`);
  };
  const changePage = (page: number, pageSize: number) => {
    navigate({ ...filter, page, pageSize });
  };

  return { changePage };
}
