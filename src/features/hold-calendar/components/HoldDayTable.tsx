"use client";

import { Table } from "@/components/ui/table/Table";
import { holdDayColumns } from "../columns/HoldDayColumn";
import type { HoldDay } from "../types";

interface Props {
  days: HoldDay[];
  today: string;
  peakAmount: number;
}

/** Data comes from the server page; this leaf only exists because the table needs column renderers. */
export function HoldDayTable({ days, today, peakAmount }: Props) {
  return (
    <div className="max-w-full overflow-x-auto">
      <Table data={days} columns={holdDayColumns(today, peakAmount)} labels={{ empty: "Không có khoản nào được giải phóng trong khoảng này" }} pagination={false} />
    </div>
  );
}
