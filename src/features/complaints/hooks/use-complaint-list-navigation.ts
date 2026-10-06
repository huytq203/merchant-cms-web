import { usePathname, useRouter } from "next/navigation";
import { toComplaintSearchParams } from "../complaint-queries";
import type { ComplaintListFilter } from "../types/types";

/** The URL is the source of truth for filter and pagination. */
export function useComplaintListNavigation(filter: ComplaintListFilter) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (next: ComplaintListFilter) => {
    router.push(`${pathname}?${toComplaintSearchParams(next)}`);
  };
  const changePage = (page: number, pageSize: number) => {
    navigate({ ...filter, page, pageSize });
  };

  return { search: navigate, changePage };
}
