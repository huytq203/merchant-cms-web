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
}

export function SettlementResults({ filter, onPageChange, onView }: Props) {
  const list = useQuery(settlementItemQueries.list(filter));

  return (
    <>
      {list.data && list.data.rows.length > 0 ? <SettlementTotalsBar totals={list.data.totals} /> : null}
      <ResultCard>
        {list.isPending ? <ResultState state="loading" loadingLabel="Đang tải dòng quyết toán" /> : null}
        {list.isError ? <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} /> : null}
        {list.data?.rows.length === 0 ? <ResultState state="empty" emptyMessage="Không có giao dịch nào trong khoảng ngày đã chọn." /> : null}
        {list.data && list.data.rows.length > 0 ? (
          <div className="max-w-full overflow-x-auto">
            <Table
              data={list.data.rows}
              columns={settlementItemColumns(onView, filter.page, filter.pageSize)}
              labels={{ empty: "Không có giao dịch" }}
              pagination={{ total: list.data.total, current: filter.page, pageSize: filter.pageSize, onChange: onPageChange }}
            />
          </div>
        ) : null}
      </ResultCard>
    </>
  );
}
