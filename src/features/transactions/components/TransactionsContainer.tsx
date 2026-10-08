"use client";

import { useQuery } from "@tanstack/react-query";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button/Button";
import { Badge } from "@/components/ui/badge/Badge";
import { TRANSACTION_STATUS_OPTIONS } from "../constants/Transaction.constants";
import { QueryListState } from "@/features/sample-data/components/QueryListState";
import { useTransactionDialogs } from "../hooks/use-transaction-dialogs";
import { useTransactionListNavigation } from "../hooks/use-transaction-list-navigation";
import { transactionQueries } from "../transaction-queries";
import type { TransactionFilterValues } from "../schemas/transaction.schema";
import type { TransactionListFilter } from "../types";
import { filterToFormValues, formValuesToFilter } from "../utils/transaction-filter";
import { DialogReconciliation } from "./DialogReconciliation";
import { DialogRefund } from "./DialogRefund";
import { TransactionDetailSheet } from "./TransactionDetailSheet";
import { TransactionFilters } from "./TransactionFilters";
import { TransactionTable } from "./TransactionTable";

type Props = {
  filter: TransactionListFilter;
  abilities: { canRefund: boolean; canDispute: boolean; canExport: boolean };
  /** False in fixture mode, where sample sub-merchant ids do not exist in the BE list. */
  showSubMerchantFilter?: boolean;
};

export function TransactionsContainer({ filter, abilities, showSubMerchantFilter = true }: Props) {
  const dialogs = useTransactionDialogs();
  const navigation = useTransactionListNavigation(filter);
  const list = useQuery(transactionQueries.list(filter));
  const { activeDialog, target } = dialogs;

  const handleSearch = (values: TransactionFilterValues) => {
    navigation.search(formValuesToFilter(values, filter.pageSize));
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getRouteTitle("/transaction")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Theo dõi và quản lý tất cả giao dịch của merchant</p>
        </div>
      </header>
      <section className="rounded-xl border bg-card p-4" aria-label="Bộ lọc tìm kiếm">
        <TransactionFilters
          key={JSON.stringify(filter)}
          defaultValues={filterToFormValues(filter)}
          onSearch={handleSearch}
          showSubMerchant={showSubMerchantFilter}
        />
        {abilities.canExport && (
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
              onClick={() => toast.info("Chức năng xuất báo cáo chưa được hỗ trợ")}
            >
              Xuất báo cáo (.xlsx)
            </Button>
          </div>
        )}
      </section>
      <div className="flex flex-wrap gap-2" aria-label="Chú giải trạng thái">
        {TRANSACTION_STATUS_OPTIONS.map((status) => (
          <Badge key={status.value} variant={status.variant} className="min-w-24 justify-center">
            {status.label}
          </Badge>
        ))}
      </div>
      <section className="rounded-xl border bg-card p-4" aria-label="Kết quả tìm kiếm">
        <h2 className="mb-3 font-semibold">Kết quả tìm kiếm {list.data ? `(${list.data.total} giao dịch)` : ""}</h2>
        <QueryListState query={list} emptyText="Không tìm thấy giao dịch nào phù hợp">
          {(data) => (
            <TransactionTable
              rows={data.rows}
              total={data.total}
              page={filter.page}
              pageSize={filter.pageSize}
              onPageChange={navigation.changePage}
              canRefund={abilities.canRefund}
              onViewDetail={(transaction) => dialogs.openFor("detail", transaction)}
              onRefund={(transaction) => dialogs.openFor("refund", transaction)}
            />
          )}
        </QueryListState>
      </section>
      <TransactionDetailSheet
        transaction={target}
        open={activeDialog === "detail"}
        onOpenChange={(open) => !open && dialogs.close()}
        canRefund={abilities.canRefund}
        canDispute={abilities.canDispute}
        onRefund={() => dialogs.openFor("refund")}
        onReconcile={() => dialogs.openFor("reconciliation")}
      />
      <DialogReconciliation
        transaction={target}
        open={activeDialog === "reconciliation"}
        onOpenChange={(open) => !open && dialogs.close()}
      />
      <DialogRefund
        transaction={target}
        open={activeDialog === "refund"}
        onOpenChange={(open) => !open && dialogs.close()}
      />
    </div>
  );
}
