"use client";

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
import { OrderForm } from "./OrderForm";
import { OrderTable } from "./OrderTable";

type Props = {
  filter: OrderListFilter;
  abilities: { canCreate: boolean };
};

export function OrdersContainer({ filter, abilities }: Props) {
  const dialogs = useOrderDialogs();
  const actions = useOrderActions(dialogs);
  const navigation = useOrderListNavigation(filter);
  const list = useQuery(orderQueries.list(filter));
  const qr = useQuery({
    ...orderQueries.detail(dialogs.target?.id ?? ""),
    enabled: dialogs.activeDialog === "qr" && Boolean(dialogs.target),
  });
  const { activeDialog, target } = dialogs;

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
          key={`${filter.orderCode ?? ""}:${filter.status ?? ""}`}
          initial={filter}
          onSearch={navigation.search}
        />
      </div>
      <ResultCard subject="đơn hàng" total={list.data?.total ?? 0}>
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
        <OrderForm
          open
          onOpenChange={(open) => !open && actions.closeDialog()}
          onSubmit={actions.submitCreate}
          isSubmitting={actions.create.isPending}
          error={actions.create.error?.message}
          serverErrors={readFieldErrors(actions.create.error)}
        />
      )}
      <DialogOrderDetail
        open={activeDialog === "detail"}
        onOpenChange={(open) => !open && actions.closeDialog()}
        order={target}
      />
      <DialogOderQR
        open={activeDialog === "qr"}
        onOpenChange={(open) => !open && actions.closeDialog()}
        order={qr.data ?? target}
        isLoading={qr.isPending && qr.fetchStatus !== "idle"}
        loadError={qr.error?.message}
        canRefresh={abilities.canCreate}
        onRefresh={actions.submitRefreshQr}
        isRefreshing={actions.refreshQr.isPending}
        refreshError={actions.refreshQr.error?.message}
        justRefreshed={actions.refreshQr.isSuccess}
      />
    </div>
  );
}
