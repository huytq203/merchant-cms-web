"use client";

import { Table } from "@/components/ui/table/Table";
import { escrowContributionColumns, withTotalRow } from "../columns/EscrowColumns";
import type { EscrowContribution } from "../types";

interface Props {
  rows: EscrowContribution[];
  masterName: string;
}

/** Data comes from the server page; this leaf only exists because the table needs column renderers. */
export function EscrowContributionsTable({ rows, masterName }: Props) {
  // The closing "Tổng" row sums each column (chốt 10/11/2026); no rows, no total.
  const data = rows.length > 0 ? withTotalRow(rows) : [];
  return (
    <div className="max-w-full overflow-x-auto">
      <Table data={data} columns={escrowContributionColumns(masterName)} labels={{ empty: "Chưa có khoản đóng góp nào" }} pagination={false} />
    </div>
  );
}
