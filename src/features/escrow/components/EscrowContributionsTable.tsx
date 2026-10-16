"use client";

import { Table } from "@/components/ui/table/Table";
import { formatAmount } from "@/lib/utils/helper";
import { escrowContributionColumns } from "../columns/EscrowColumns";
import type { EscrowContribution } from "../types";

interface Props {
  rows: EscrowContribution[];
  masterName: string;
}

/** Data comes from the server page; this leaf only exists because the table needs column renderers. */
export function EscrowContributionsTable({ rows, masterName }: Props) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <>
      <div className="max-w-full overflow-x-auto">
        <Table data={rows} columns={escrowContributionColumns(masterName)} labels={{ empty: "Chưa có khoản đóng góp nào" }} pagination={false} />
      </div>
      {rows.length > 0 ? (
        <p className="mt-3 flex justify-between gap-4 px-4 text-sm font-semibold">
          <span>Tổng</span>
          <span className="tabular-nums">{formatAmount(total)}</span>
        </p>
      ) : null}
    </>
  );
}
