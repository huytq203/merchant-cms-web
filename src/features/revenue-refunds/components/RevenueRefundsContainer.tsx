"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { ResultCard } from "@/components/page/ResultCard";
import { ResultState } from "@/components/page/ResultState";
import { Table } from "@/components/ui/table/Table";
import { revenueRefundColumns } from "../columns/RevenueRefundColumn";
import { useRefundApproval } from "../hooks/use-refund-approval";
import { revenueRefundQueries } from "../revenue-refund-queries";
import type { RefundFilter } from "../types";
import { RefundApproveDialog } from "./RefundApproveDialog";
import { RevenueRefundFilter } from "./RevenueRefundFilter";

interface Props {
  filter: RefundFilter;
  canApprove: boolean;
  subNames: Record<string, string>;
}

export function RevenueRefundsContainer({ filter, canApprove, subNames }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const list = useQuery(revenueRefundQueries.list(filter));
  const approval = useRefundApproval();
  const search = (next: RefundFilter) => {
    const query = new URLSearchParams(Object.entries(next).filter((entry): entry is [string, string] => Boolean(entry[1]))).toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/revenue-refunds")}
        description="Tạo yêu cầu từ chi tiết đơn hàng. Khoản hoàn trừ vào số dư khả dụng của Sub-merchant."
      />
      <RevenueRefundFilter key={filter.status ?? ""} initial={filter} onSearch={search} />
      <ResultCard>
        {list.isPending ? <ResultState state="loading" loadingLabel="Đang tải yêu cầu hoàn tiền" /> : null}
        {list.isError ? <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} /> : null}
        {list.data?.length === 0 ? <ResultState state="empty" emptyMessage="Chưa có yêu cầu hoàn tiền nào phù hợp." /> : null}
        {list.data && list.data.length > 0 ? (
          <div className="max-w-full overflow-x-auto">
            <Table
              data={list.data}
              columns={revenueRefundColumns({ onApprove: canApprove ? approval.open : undefined, subNames })}
              labels={{ empty: "Chưa có yêu cầu hoàn tiền" }}
            />
          </div>
        ) : null}
      </ResultCard>
      <RefundApproveDialog approval={approval} subNames={subNames} />
    </div>
  );
}
