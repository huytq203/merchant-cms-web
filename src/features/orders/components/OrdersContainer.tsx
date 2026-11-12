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
import { OrderCancelDialog } from "./OrderCancelDialog";
import { OrderTable } from "./OrderTable";
import { RefundCreateDialog, type RefundOrder } from "@/features/revenue-refunds/components/RefundCreateDialog";
import { ComplaintCreateDialog } from "@/features/complaints/components/ComplaintCreateDialog";
import type { Order } from "../types/types";
import { customerDisplayHref, openCustomerDisplay } from "@/features/customer-display/utils/open-display";

const orderFilterKey = (filter: OrderListFilter) =>
  [filter.orderCode, filter.status, (filter.subMerchantIds ?? []).join(","), filter.createdFrom, filter.createdTo].map((part) => part ?? "").join(":");

type Props = {
  filter: OrderListFilter;
  /** canCancel: CANCEL_ORDER; canRefund: CREATE_REFUND; canViewRefunds: VIEW_REFUND; canDispute: CREATE_DISPUTE. */
  abilities: { canCreate: boolean; canCancel: boolean; canRefund: boolean; canViewRefunds: boolean; canDispute: boolean };
};

export function OrdersContainer({ filter, abilities }: Props) {
  const dialogs = useOrderDialogs();
  const actions = useOrderActions(dialogs);
  const navigation = useOrderListNavigation(filter);
  const list = useQuery(orderQueries.list(filter));
  const { activeDialog, target } = dialogs;
  const [refundOrder, setRefundOrder] = useState<RefundOrder | null>(null);
  // Khiếu nại mở từ chi tiết đơn ("Tra soát") hoặc từ nút trên dòng: dialog giữ mã giao dịch (và mã đơn hàng) của đơn đó.
  const [dispute, setDispute] = useState<{ transactionCode: string; orderCode: string } | null>(null);
  const [cancelFromDetail, setCancelFromDetail] = useState(false);
  const startCancel = (order: Order, fromDetail: boolean) => {
    actions.cancel.reset();
    setCancelFromDetail(fromDetail);
    dialogs.openFor("cancel", order);
  };
  const closeCancel = () => {
    const back = cancelFromDetail ? target : null;
    actions.closeDialog();
    if (back) dialogs.openFor("detail", back);
  };
  const startDispute = (order: Order) => {
    if (order.transactionCode) setDispute({ transactionCode: order.transactionCode, orderCode: order.orderCode });
  };
  const startRefund = (order: Order) => {
    actions.closeDialog();
    setRefundOrder({ id: order.id, orderCode: order.orderCode, amount: order.amount, subMerchantName: order.subMerchantName });
  };
  // The list row has no QR, so both the QR and the detail dialog read the order by id.
  const fresh = useQuery({
    ...orderQueries.detail(target?.id ?? ""),
    enabled: (activeDialog === "qr" || activeDialog === "detail" || activeDialog === "cancel") && Boolean(target),
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
            onCustomerDisplay={abilities.canCreate ? (order) => openCustomerDisplay(customerDisplayHref.order(order.id)) : undefined}
            onCancel={abilities.canCancel ? (order) => startCancel(order, false) : undefined}
            onRefund={abilities.canRefund ? startRefund : undefined}
            onDispute={abilities.canDispute ? startDispute : undefined}
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
        cancel={{ canCancel: abilities.canCancel, onStart: (order) => startCancel(order, true) }}
        dispute={{ canCreate: abilities.canDispute, onStart: () => { const order = fresh.data ?? target; if (order) startDispute(order); } }}
        {...qrDialog}
      />
      {abilities.canDispute ? (
        <ComplaintCreateDialog
          title="Khởi tạo yêu cầu Tra soát"
          transactionCode={dispute?.transactionCode}
          orderCode={dispute?.orderCode}
          open={dispute !== null}
          onOpenChange={(open) => !open && setDispute(null)}
        />
      ) : null}
      <OrderCancelDialog
        order={activeDialog === "cancel" ? (fresh.data ?? target) : null}
        onClose={closeCancel}
        onConfirm={() => void actions.submitCancel()}
        isPending={actions.cancel.isPending}
        isReloading={fresh.isFetching}
        loadError={fresh.error?.message}
        error={actions.cancel.error}
      />
      {refundOrder ? <RefundCreateDialog order={refundOrder} onClose={() => setRefundOrder(null)} /> : null}
      <DialogOderQR open={activeDialog === "qr"} onOpenChange={(open) => !open && actions.closeDialog()} {...qrDialog} />
    </div>
  );
}
