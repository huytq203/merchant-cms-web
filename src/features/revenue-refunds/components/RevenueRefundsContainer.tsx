"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { ResultCard } from "@/components/page/ResultCard";
import { ResultState } from "@/components/page/ResultState";
import { Button } from "@/components/ui/button/Button";
import { Table } from "@/components/ui/table/Table";
import { revenueRefundColumns } from "../columns/RevenueRefundColumn";
import { useRefundApproval } from "../hooks/use-refund-approval";
import { useRefundCancel } from "../hooks/use-refund-cancel";
import { downloadRefundsCsv, revenueRefundQueries } from "../revenue-refund-queries";
import type { RefundFilter, RevenueRefund } from "../types";
import { canCancelRefund, refundFilterToSearch, toRefundQuery } from "../utils/refund-query";
import { RefundApproveDialog } from "./RefundApproveDialog";
import { RefundCancelDialog } from "./RefundCancelDialog";
import { RefundCreateDialog, type RefundOrder } from "./RefundCreateDialog";
import { RefundOrderPicker } from "./RefundOrderPicker";
import { RefundSummaryStrip } from "./RefundSummaryStrip";
import { RevenueRefundFilter } from "./RevenueRefundFilter";

interface Props {
  filter: RefundFilter;
  /** Hôm nay theo giờ Việt Nam (yyyy-MM-dd), do server đưa xuống để kỳ "7 ngày" giống nhau ở SSR và client. */
  today: string;
  canApprove: boolean;
  /** CANCEL_REFUND hoặc APPROVE_REFUND: hủy được yêu cầu của người khác. */
  canCancelAny?: boolean;
  /** Người đang đăng nhập, để người chỉ có CREATE_REFUND thấy nút Hủy trên yêu cầu của chính mình. */
  userId?: string;
  /** CREATE_REFUND: offers "Tạo yêu cầu hoàn tiền", which starts by picking a successful transaction. */
  canCreate?: boolean;
  subNames: Record<string, string>;
}

/** Creating starts here or from an order's detail; both end in the same OTP-confirmed form. */
type CreateStep = { step: "closed" } | { step: "pick" } | { step: "form"; order: RefundOrder };

export function RevenueRefundsContainer({ filter, today, canApprove, canCancelAny = canApprove, userId = "", canCreate = false, subNames }: Props) {
  const [create, setCreate] = useState<CreateStep>({ step: "closed" });
  const router = useRouter();
  const pathname = usePathname();
  const list = useQuery(revenueRefundQueries.list(filter, today));
  const summary = useQuery(revenueRefundQueries.summary(filter, today));
  const approval = useRefundApproval();
  const cancel = useRefundCancel();
  // Xuất đúng bộ lọc đang xem (kể cả nhóm trạng thái đang chọn), không phân trang.
  const exportCsv = useMutation({
    mutationFn: () => downloadRefundsCsv(toRefundQuery(filter, today)),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Không xuất được file, vui lòng thử lại"),
  });
  const search = (next: RefundFilter) => {
    const query = refundFilterToSearch(next);
    router.push(query ? `${pathname}?${query}` : pathname);
  };
  // Hủy: quyền hủy/duyệt, hoặc người tạo có CREATE_REFUND; theo từng dòng (xem canCancelRefund).
  const showCancel = canCancelAny || canCreate;
  const canCancelRow = (refund: RevenueRefund) => canCancelRefund(refund, { canCancelAny, canCreate, userId });

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/revenue-refunds")}
        description="Chọn một đơn hàng thành công để tạo yêu cầu, hoặc tạo từ chi tiết đơn hàng. Khoản hoàn trừ vào số dư khả dụng của Sub-merchant."
        action={(
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
              onClick={() => exportCsv.mutate()}
              isLoading={exportCsv.isPending}
            >
              Xuất Excel
            </Button>
            {canCreate ? (
              <Button type="button" variant="solid" leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setCreate({ step: "pick" })}>
                Tạo yêu cầu hoàn tiền
              </Button>
            ) : null}
          </div>
        )}
      />
      <RefundSummaryStrip summary={summary.data} selected={filter.group} onSelect={(group) => search({ ...filter, group })} />
      <RevenueRefundFilter key={JSON.stringify(filter)} initial={filter} onSearch={search} />
      <ResultCard>
        {list.isPending ? <ResultState state="loading" loadingLabel="Đang tải yêu cầu hoàn tiền" /> : null}
        {list.isError ? <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} /> : null}
        {list.data?.length === 0 ? <ResultState state="empty" emptyMessage="Chưa có yêu cầu hoàn tiền nào phù hợp." /> : null}
        {list.data && list.data.length > 0 ? (
          <div className="max-w-full overflow-x-auto">
            <Table
              data={list.data}
              columns={revenueRefundColumns({ onApprove: canApprove ? approval.open : undefined, onCancel: showCancel ? cancel.open : undefined, canCancel: canCancelRow, subNames })}
              labels={{ empty: "Chưa có yêu cầu hoàn tiền" }}
            />
          </div>
        ) : null}
      </ResultCard>
      <RefundApproveDialog approval={approval} subNames={subNames} />
      <RefundCancelDialog cancel={cancel} />
      {create.step === "pick" ? (
        <RefundOrderPicker onPick={(order) => setCreate({ step: "form", order })} onClose={() => setCreate({ step: "closed" })} />
      ) : null}
      {create.step === "form" ? <RefundCreateDialog order={create.order} onClose={() => setCreate({ step: "closed" })} /> : null}
    </div>
  );
}
