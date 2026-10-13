"use client";

import { useQuery } from "@tanstack/react-query";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page/PageHeader";
import { ResultCard } from "@/components/page/ResultCard";
import { Button } from "@/components/ui/button/Button";
import { QueryListState } from "@/features/sample-data/components/QueryListState";
import { useRefundDialogs } from "../hooks/use-refund-dialogs";
import { useRefundListNavigation } from "../hooks/use-refund-list-navigation";
import { refundQueries } from "../refund-queries";
import type { RefundFilterValue } from "../schemas/Refund.schema";
import type { RefundListFilter } from "../types/type";
import { filterToFormValues, formValuesToFilter } from "../utils/refund-filter";
import { DialogCancelRefund } from "./DialogCancelRefund";
import RefundFilter from "./RefundFilter";
import { RefundDetail } from "./RefundDetail";
import { RefundTable } from "./RefundTable";

type Props = {
  filter: RefundListFilter;
  abilities: { canCancel: boolean };
  /** False in fixture mode, where sample sub-merchant ids do not exist in the BE list. */
  showSubMerchantFilter?: boolean;
};

export function RefundsContainer({ filter, abilities, showSubMerchantFilter = true }: Props) {
  const dialogs = useRefundDialogs();
  const navigation = useRefundListNavigation(filter);
  const list = useQuery(refundQueries.list(filter));
  const { activeDialog, target } = dialogs;

  const handleSearch = (values: RefundFilterValue) => {
    navigation.search(formValuesToFilter(values, filter.pageSize));
  };
  const handleConfirmCancel = () => {
    // Chưa có API BE: báo rõ thay vì giả vờ đã hủy thành công.
    toast.info("Chức năng hủy yêu cầu hoàn tiền chưa được hỗ trợ");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/refund")}
        description="Kiểm tra, xử lý các yêu cầu hoàn tiền của cửa hàng."
        action={
          <Button
            type="button"
            variant="outline"
            leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
            onClick={() => toast.info("Chức năng xuất Excel chưa được hỗ trợ")}
          >
            Xuất Excel
          </Button>
        }
      />
      <RefundFilter
        key={JSON.stringify(filter)}
        defaultValues={filterToFormValues(filter)}
        onSearch={handleSearch}
        showSubMerchant={showSubMerchantFilter}
      />
      <ResultCard>
        <h2 className="px-4 pb-1 pt-4 font-semibold">
          Kết quả tìm kiếm
          {list.data ? <span className="ml-2 text-sm font-normal text-muted-foreground">{list.data.total} yêu cầu</span> : null}
        </h2>
        <div className="p-4 pt-2">
          <QueryListState query={list} emptyText="Không tìm thấy yêu cầu hoàn tiền nào phù hợp">
            {(data) => (
              <RefundTable
                rows={data.rows}
                total={data.total}
                page={filter.page}
                pageSize={filter.pageSize}
                onPageChange={navigation.changePage}
                canCancel={abilities.canCancel}
                onViewDetail={(refund) => dialogs.openFor("detail", refund)}
                onCancelRefund={(refund) => dialogs.openFor("cancel", refund)}
              />
            )}
          </QueryListState>
        </div>
      </ResultCard>
      <RefundDetail
        refund={target}
        open={activeDialog === "detail"}
        onOpenChange={(open) => !open && dialogs.close()}
        canCancel={abilities.canCancel}
        onCancel={() => target && dialogs.openFor("cancel", target)}
      />
      <DialogCancelRefund
        refund={target}
        open={activeDialog === "cancel"}
        onOpenChange={(open) => !open && dialogs.close()}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
