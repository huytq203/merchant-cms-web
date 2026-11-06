"use client";

import { useQuery } from "@tanstack/react-query";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button/Button";
import { PageHeader } from "@/components/page/PageHeader";
import { ResultCard } from "@/components/page/ResultCard";
import { QueryListState } from "@/features/sample-data/components/QueryListState";
import { useTransactionDialogs } from "../hooks/use-transaction-dialogs";
import { useTransactionListNavigation } from "../hooks/use-transaction-list-navigation";
import { transactionQueries } from "../transaction-queries";
import type { TransactionFilterValues } from "../schemas/transaction.schema";
import type { TransactionListFilter } from "../types";
import { filterToFormValues, formValuesToFilter } from "../utils/transaction-filter";
import { RefundCreateDialog } from "@/features/revenue-refunds/components/RefundCreateDialog";
import { ComplaintCreateDialog } from "@/features/complaints/components/ComplaintCreateDialog";
import { TransactionDetailSheet } from "./TransactionDetailSheet";
import { TransactionFilters } from "./TransactionFilters";
import { TransactionTable } from "./TransactionTable";

type Props = {
  filter: TransactionListFilter;
  abilities: { canRefund: boolean; canDispute: boolean; canExport: boolean };
};

export function TransactionsContainer({ filter, abilities }: Props) {
  const dialogs = useTransactionDialogs();
  const navigation = useTransactionListNavigation(filter);
  const list = useQuery(transactionQueries.list(filter));
  const { activeDialog, target } = dialogs;

  const handleSearch = (values: TransactionFilterValues) => {
    navigation.search(formValuesToFilter(values, filter.pageSize));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/transaction")}
        description="Theo dõi và quản lý tất cả giao dịch của merchant"
        action={abilities.canExport ? (
          <Button
            type="button"
            variant="outline"
            leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
            onClick={() => toast.info("Chức năng xuất báo cáo chưa được hỗ trợ")}
          >
            Xuất báo cáo (.xlsx)
          </Button>
        ) : undefined}
      />
      <TransactionFilters
        key={JSON.stringify(filter)}
        defaultValues={filterToFormValues(filter)}
        onSearch={handleSearch}
      />
      <ResultCard>
        <h2 className="px-4 pb-1 pt-4 font-semibold">
          Kết quả tìm kiếm
          {list.data ? <span className="ml-2 text-sm font-normal text-muted-foreground">{list.data.total} giao dịch</span> : null}
        </h2>
        <div className="p-4 pt-2">
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
        </div>
      </ResultCard>
      <TransactionDetailSheet
        transaction={target}
        open={activeDialog === "detail"}
        onOpenChange={(open) => !open && dialogs.close()}
        canRefund={abilities.canRefund}
        canDispute={abilities.canDispute}
        onRefund={() => dialogs.openFor("refund")}
        onReconcile={() => dialogs.openFor("reconciliation")}
      />
      {/* "Tra soát" is a complaint on this transaction: same form and same POST as the complaint screen. */}
      {abilities.canDispute ? (
        <ComplaintCreateDialog
          title="Khởi tạo yêu cầu Tra soát"
          transactionCode={target?.transactionCode}
          open={activeDialog === "reconciliation"}
          onOpenChange={(open) => !open && dialogs.close()}
        />
      ) : null}
      {/* The real refund: OTP-confirmed request on the Sub's available balance, approved by another user. */}
      {activeDialog === "refund" && target ? (
        <RefundCreateDialog
          order={{ id: target.id, orderCode: target.orderCode, amount: target.amount, subMerchantName: target.subMerchantName }}
          onClose={dialogs.close}
        />
      ) : null}
    </div>
  );
}
