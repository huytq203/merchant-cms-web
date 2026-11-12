"use client";

import { useQuery } from "@tanstack/react-query";
import { ResultCard } from "@/components/page/ResultCard";
import { ResultState } from "@/components/page/ResultState";
import { Table } from "@/components/ui/table/Table";
import { settlementItemColumns } from "../columns/SettlementItemColumn";
import { settlementItemQueries } from "../settlement-item-queries";
import type { ResolvedSettlementFilter, SettlementItem } from "../types";
import { SettlementTotalsBar } from "./SettlementTotalsBar";

interface Props {
  filter: ResolvedSettlementFilter;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (row: SettlementItem) => void;
  onPickSub: (subMerchantId: string) => void;
  /** Sub có trong ô lọc; Sub ngoài danh sách (đã khóa) hiện ở dải "Theo Sub" nhưng không bấm được. */
  pickableSubIds?: ReadonlySet<string>;
}

export function SettlementResults({ filter, onPageChange, onView, onPickSub, pickableSubIds }: Props) {
  const list = useQuery(settlementItemQueries.list(filter));

  return (
    <>
      {list.data && list.data.rows.length > 0 ? <SettlementTotalsBar totals={list.data.totals} onPickSub={filter.subMerchantIds?.length === 1 ? undefined : onPickSub} trancheFiltered={Boolean(filter.trancheStatus)} pickableSubIds={pickableSubIds} /> : null}
      <ResultCard>
        {list.isPending ? <ResultState state="loading" loadingLabel="Đang tải dòng quyết toán" /> : null}
        {list.isError ? <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} /> : null}
        {list.data?.rows.length === 0 ? <ResultState state="empty" emptyMessage="Không có đơn hàng nào trong khoảng ngày đã chọn." /> : null}
        {list.data && list.data.rows.length > 0 ? (
          <div className="max-w-full overflow-x-auto">
            <Table
              data={list.data.rows}
              columns={settlementItemColumns(onView, filter.page, filter.pageSize)}
              labels={{ empty: "Không có đơn hàng" }}
              pagination={{ total: list.data.total, current: filter.page, pageSize: filter.pageSize, onChange: onPageChange }}
            />
          </div>
        ) : null}
      </ResultCard>
    </>
  );
}
