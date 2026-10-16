"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { ResultCard } from "@/components/page/ResultCard";
import { ResultState } from "@/components/page/ResultState";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useOrderActions } from "../hooks/use-order-actions";
import { useOrderDialogs } from "../hooks/use-order-dialogs";
import { useOrderListNavigation } from "../hooks/use-order-list-navigation";
import { orderQueries } from "../order-queries";
import { readFieldErrors } from "../order-api";
import type { OrderListFilter } from "../types/types";
import { DialogOderQR } from "./DialogOderQR";
import { DialogOrderDetail } from "./DialogOrderDetail";
import { OrderFilter } from "./OrderFilter";
import { OrderCreateDialog } from "./OrderCreateDialog";
import { OrderTable } from "./OrderTable";
import { RefundCreateDialog, type RefundOrder } from "@/features/revenue-refunds/components/RefundCreateDialog";
import type { Order } from "../types/types";

const orderFilterKey = (filter: OrderListFilter) =>
  [filter.orderCode, filter.status, filter.subMerchantId, filter.createdFrom, filter.createdTo].map((part) => part ?? "").join(":");

type Props = {
  filter: OrderListFilter;
  /** canRefund: CREATE_REFUND; canViewRefunds: VIEW_REFUND. */
  abilities: { canCreate: boolean; canRefund: boolean; canViewRefunds: boolean };
};

export function OrdersContainer({ filter, abilities }: Props) {
  const dialogs = useOrderDialogs();
  const actions = useOrderActions(dialogs);
  const navigation = useOrderListNavigation(filter);
  const list = useQuery(orderQueries.list(filter));
  const { activeDialog, target } = dialogs;
  const [refundOrder, setRefundOrder] = useState<RefundOrder | null>(null);
  const startRefund = (order: Order) => {
    actions.closeDialog();
    setRefundOrder({ id: order.id, orderCode: order.orderCode, amount: order.amount, subMerchantName: order.subMerchantName });
  };
  // The list row has no QR, so both the QR and the detail dialog read the order by id.
  const fresh = useQuery({
    ...orderQueries.detail(target?.id ?? ""),
    enabled: (activeDialog === "qr" || activeDialog === "detail") && Boolean(target),
  });
  const qrDialog = {
    order: fresh.data ?? target,
    isLoading: fresh.isPending && fresh.fetchStatus !== "idle",
    loadError: fresh.error?.message,
    canRefresh: abilities.canCreate,
    onRefresh: actions.submitRefreshQr,
    isRefreshing: actions.refreshQr.isPending,
    refreshError: actions.refreshQr.error?.message,
    justRefreshed: actions.refreshQr.isSuccess,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/order")}
        action={abilities.canCreate ? (
          <Button type="button" variant="solid" onClick={dialogs.openCreate}>
            <Plus size={16} aria-hidden="true" /> Tạo đơn hàng
          </Button>
        ) : undefined}
      />
      <div>
        <OrderFilter
          key={orderFilterKey(filter)}
          initial={filter}
          onSearch={navigation.search}
        />
      </div>
      <ResultCard>
        {list.isPending ? <ResultState state="loading" /> : null}
        {list.isError ? <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} /> : null}
        {list.data?.rows.length === 0 ? <ResultState state="empty" emptyMessage="Không có đơn hàng" /> : null}
        {list.data?.rows.length ? (
          <OrderTable
            rows={list.data.rows}
            total={list.data.total}
            page={filter.page}
            pageSize={filter.pageSize}
            onPageChange={navigation.changePage}
            onView={(order) => dialogs.openFor("detail", order)}
            onViewQr={(order) => dialogs.openFor("qr", order)}
          />
        ) : null}
      </ResultCard>
      {activeDialog === "create" && (
        <OrderCreateDialog
          onClose={actions.closeDialog}
          created={target}
          onSubmit={actions.submitCreate}
          isSubmitting={actions.create.isPending}
          error={actions.create.error?.message}
          serverErrors={readFieldErrors(actions.create.error)}
          onViewDetail={(order) => dialogs.openFor("detail", order)}
          onCreateAnother={() => {
            actions.create.reset();
            dialogs.openCreate();
          }}
        />
      )}
      <DialogOrderDetail
        open={activeDialog === "detail"}
        onOpenChange={(open) => !open && actions.closeDialog()}
        refund={{ canCreate: abilities.canRefund, canView: abilities.canViewRefunds, onStart: startRefund }}
        {...qrDialog}
      />
      {refundOrder ? <RefundCreateDialog order={refundOrder} onClose={() => setRefundOrder(null)} /> : null}
      <DialogOderQR open={activeDialog === "qr"} onOpenChange={(open) => !open && actions.closeDialog()} {...qrDialog} />
    </div>
  );
}
