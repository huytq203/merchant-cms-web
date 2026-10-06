"use client";

import { useQuery } from "@tanstack/react-query";
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
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Danh sách đơn hàng</h1>
        {abilities.canCreate && (
          <Button type="button" variant="solid" onClick={dialogs.openCreate}>
            <Plus size={16} aria-hidden="true" /> Tạo đơn hàng
          </Button>
        )}
      </header>
      <section className="rounded-xl border bg-card p-4" aria-label="Bộ lọc tìm kiếm">
        <OrderFilter
          key={`${filter.orderCode ?? ""}:${filter.status ?? ""}`}
          initial={filter}
          onSearch={navigation.search}
        />
      </section>
      <section className="rounded-xl border bg-card p-4" aria-label="Kết quả tìm kiếm">
        <h2 className="mb-3 font-semibold">Kết quả tìm kiếm {list.data ? `(${list.data.total})` : ""}</h2>
        {list.isPending ? (
          <p>Đang tải danh sách đơn hàng...</p>
        ) : list.isError ? (
          <div role="alert">
            <p>{list.error.message}</p>
            <Button type="button" variant="ghost" onClick={() => void list.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : list.data.rows.length === 0 ? (
          <p>Không có đơn hàng</p>
        ) : (
          <OrderTable
            rows={list.data.rows}
            total={list.data.total}
            page={filter.page}
            pageSize={filter.pageSize}
            onPageChange={navigation.changePage}
            onView={(order) => dialogs.openFor("detail", order)}
            onViewQr={(order) => dialogs.openFor("qr", order)}
          />
        )}
      </section>
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
