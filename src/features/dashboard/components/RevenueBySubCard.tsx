"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Table } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/Card";
import { ChartBar } from "@/components/ui/chart/Chart";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle/Toggle";
import { ResultState } from "@/components/page/ResultState";
import { ModuleQueryError } from "@/features/sample-data/components/ModuleQueryError";
import { SubMerchantFilterField } from "@/features/sample-data/components/SubMerchantFilterField";
import { formatAmount } from "@/lib/utils/helper";
import { revenueQueries } from "../revenue-queries";
import type { RevenuePreset } from "../schemas/revenue.schema";
import { buildRevenueChart, daysBetween, revenueWindowText, totalsBySub, type SubRevenueTotals } from "../utils/revenue-series";

const money = (value: number) => <span className="whitespace-nowrap font-mono tabular-nums">{formatAmount(value)}</span>;

const COLUMNS: ColumnDef<SubRevenueTotals>[] = [
  {
    id: "sub",
    header: "Sub-merchant",
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.subMerchantName}</p>
        <p className="font-mono text-xs text-muted-foreground">{row.original.subMerchantCode ?? ""}</p>
      </div>
    ),
  },
  { id: "count", header: "Số giao dịch", meta: { align: "right" }, cell: ({ row }) => <span className="tabular-nums">{row.original.transactionCount}</span> },
  { id: "gross", header: "Doanh thu gộp", meta: { align: "right" }, cell: ({ row }) => money(row.original.grossAmount) },
  { id: "fee", header: "Phí", meta: { align: "right" }, cell: ({ row }) => money(row.original.feeAmount) },
  { id: "net", header: "Thực nhận", meta: { align: "right" }, cell: ({ row }) => money(row.original.netAmount) },
];

type Mode = "DAY" | "MONTH";

/** Presets of each mode; the first one is what a mode opens on (chốt 10/11/2026: 7 ngày / Tháng này). */
const MODE_PRESETS: Record<Mode, { value: RevenuePreset; label: string }[]> = {
  DAY: [
    { value: "DAY_7", label: "7 ngày" },
    { value: "DAY_15", label: "15 ngày" },
    { value: "DAY_30", label: "30 ngày" },
  ],
  MONTH: [
    { value: "THIS_MONTH", label: "Tháng này" },
    { value: "LAST_MONTH", label: "Tháng trước" },
  ],
};

/**
 * Revenue of each Sub-merchant by Vietnam day of payment (chốt 03/11, đổi kỳ 10/11/2026): a stacked chart of
 * gross per Sub, then each Sub's gross, MDR fee and net over the 7/15/30 days or the days of this/last month. Only Sub-ledger payments are counted, and
 * refunds are not deducted.
 */
export function RevenueBySubCard() {
  const [preset, setPreset] = useState<RevenuePreset>("DAY_7");
  const [subMerchantId, setSubMerchantId] = useState("");
  const mode: Mode = preset === "THIS_MONTH" || preset === "LAST_MONTH" ? "MONTH" : "DAY";
  const query = useQuery(revenueQueries.series({ preset, ...(subMerchantId ? { subMerchantId } : {}) }));
  const windowText = revenueWindowText(preset);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle>Doanh thu theo Sub-merchant</CardTitle>
          <p className="text-[13px] text-muted-foreground">
            {windowText}, theo ngày thanh toán. Thực nhận = doanh thu gộp trừ phí; chưa trừ hoàn tiền.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-64">
            <SubMerchantFilterField allowAll value={subMerchantId} onChange={setSubMerchantId} />
          </div>
          <ToggleGroup
            type="single"
            aria-label="Gom doanh thu theo"
            value={[mode]}
            // A single group can be cleared by clicking the active item; keep the current choice then.
            onValueChange={(next) => next[0] && next[0] !== mode && setPreset(MODE_PRESETS[next[0] as Mode][0]!.value)}
          >
            <ToggleGroupItem value="DAY">Theo ngày</ToggleGroupItem>
            <ToggleGroupItem value="MONTH">Theo tháng</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            aria-label="Kỳ xem doanh thu"
            value={[preset]}
            onValueChange={(next) => next[0] && setPreset(next[0] as RevenuePreset)}
          >
            {MODE_PRESETS[mode].map((item) => (
              <ToggleGroupItem key={item.value} value={item.value}>
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 pt-2">
        {query.isPending && <Skeleton className="h-[420px]" />}
        {query.isError && <ModuleQueryError error={query.error} onRetry={() => void query.refetch()} />}
        {query.data && query.data.points.length === 0 && (
          <ResultState state="empty" emptyMessage={`Chưa có giao dịch thanh toán nào trong ${windowText}.`} />
        )}
        {query.data && query.data.points.length > 0 && (() => {
          const periods = daysBetween(query.data.from, query.data.to);
          const chart = buildRevenueChart(query.data.points, periods, query.data.granularity);
          const { subs, total } = totalsBySub(query.data.points);
          return (
            <>
              <div role="img" aria-label={`Doanh thu gộp theo ngày, ${windowText}. Tổng ${formatAmount(total.grossAmount)}`}>
                <ChartBar data={chart.rows} xKey="label" series={chart.series} stacked height={280} />
              </div>
              <Table data={subs} columns={COLUMNS} pagination={false} />
              <p className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-sm">
                <span className="font-semibold">Tổng cộng</span>
                <span>{total.transactionCount} giao dịch</span>
                <span>Gộp {money(total.grossAmount)}</span>
                <span>Phí {money(total.feeAmount)}</span>
                <span>Thực nhận {money(total.netAmount)}</span>
              </p>
            </>
          );
        })()}
      </CardContent>
    </Card>
  );
}
