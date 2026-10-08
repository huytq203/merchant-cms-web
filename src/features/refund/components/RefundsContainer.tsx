"use client";

import { useQuery } from "@tanstack/react-query";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { Download } from "lucide-react";
import { toast } from "sonner";
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
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{getRouteTitle("/refund")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Kiểm tra, xử lý các yêu cầu hoàn tiền của cửa hàng.</p>
        </div>
      </header>
      <section className="rounded-xl border bg-card p-4" aria-label="Bộ lọc tìm kiếm">
        <RefundFilter
          key={JSON.stringify(filter)}
          defaultValues={filterToFormValues(filter)}
          onSearch={handleSearch}
          showSubMerchant={showSubMerchantFilter}
        />
        <div className="mt-4 flex justify-end">
        <Button
          type="button"
          variant="outline"
          leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
          onClick={() => toast.info("Chức năng xuất Excel chưa được hỗ trợ")}
        >
          Xuất Excel
        </Button>
        </div>
      </section>
      <section className="rounded-xl border bg-card p-4" aria-label="Kết quả tìm kiếm">
        <h2 className="mb-3 font-semibold">Kết quả tìm kiếm {list.data ? `(${list.data.total} yêu cầu)` : ""}</h2>
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
      </section>
      <RefundDetail
        refund={target}
        open={activeDialog === "detail"}
        onOpenChange={(open) => !open && dialogs.close()}
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
