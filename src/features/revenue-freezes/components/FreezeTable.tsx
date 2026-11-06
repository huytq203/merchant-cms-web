"use client";

import { Table } from "@/components/ui/table/Table";
import { freezeColumns } from "../columns/FreezeColumn";
import type { RevenueFreeze } from "../types";
import { FreezeReleaseList } from "./FreezeReleaseList";

/**
 * Data comes from the server page; this leaf only exists because the table needs column renderers and row expansion.
 * A row opens to its releases when it has any.
 */
export function FreezeTable({ freezes }: { freezes: RevenueFreeze[] }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <Table
        data={freezes}
        columns={freezeColumns}
        enableExpanding
        getRowCanExpand={(freeze) => freeze.releases.length > 0}
        renderSubComponent={({ row }) => <FreezeReleaseList freeze={row} />}
        labels={{ empty: "Không có khoản đóng băng nào" }}
        pagination={false}
      />
    </div>
  );
}
