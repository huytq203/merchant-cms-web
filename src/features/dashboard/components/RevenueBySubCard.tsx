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
import {
  buildRevenueChart,
  compactAmount,
  daysBetween,
  revenueWindowText,
  totalsBySub,
  type RevenueMetric,
  type RevenueTotals,
  type SubRevenueTotals,
} from "../utils/revenue-series";

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

/**
 * Every period in one row (yêu cầu 11/11/2026): the old "Theo ngày / Theo tháng" pair is gone because both modes chart
 * by day anyway; "Theo tháng" only meant "this or last calendar month". 7 ngày stays the default (chốt 10/11/2026).
 */
const PRESETS: { value: RevenuePreset; label: string }[] = [
  { value: "DAY_7", label: "7 ngày" },
  { value: "DAY_15", label: "15 ngày" },
  { value: "DAY_30", label: "30 ngày" },
  { value: "THIS_MONTH", label: "Tháng này" },
  { value: "LAST_MONTH", label: "Tháng trước" },
];

/** What the stacked columns measure; switching only redraws the data already loaded. */
const METRICS: { value: RevenueMetric; label: string }[] = [
  { value: "GROSS", label: "Doanh thu gộp" },
  { value: "NET", label: "Thực nhận" },
  { value: "COUNT", label: "Số giao dịch" },
];

const fullAmount = (value: number) => formatAmount(value);
const fullCount = (value: number) => `${value.toLocaleString("vi-VN")} giao dịch`;

/** The period's totals across the Subs on screen, read before the chart. */
function SummaryTiles({ total }: { total: RevenueTotals }) {
  const tiles = [
    { label: "Doanh thu gộp", value: formatAmount(total.grossAmount) },
    { label: "Phí", value: formatAmount(total.feeAmount) },
    { label: "Thực nhận", value: formatAmount(total.netAmount) },
    { label: "Số giao dịch", value: total.transactionCount.toLocaleString("vi-VN") },
  ];
  return (
    <ul aria-label="Tổng kỳ" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <li key={tile.label} className="rounded-lg border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground">{tile.label}</p>
          <p className="font-mono text-base font-semibold tabular-nums">{tile.value}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Revenue of each Sub-merchant by Vietnam day of payment (chốt 03/11, đổi kỳ 10/11, gộp bộ lọc 11/11/2026): one
 * column per day with every Sub stacked in its own colour and the day's total on top, then the period totals and
 * each Sub's gross, MDR fee and net. Only Sub-ledger payments are counted, and refunds are not deducted.
 */
export function RevenueBySubCard() {
  const [preset, setPreset] = useState<RevenuePreset>("DAY_7");
  const [metric, setMetric] = useState<RevenueMetric>("GROSS");
  const [subMerchantId, setSubMerchantId] = useState("");
  const query = useQuery(revenueQueries.series({ preset, ...(subMerchantId ? { subMerchantId } : {}) }));
  // The label follows the period of the data on screen when there is one (see revenueWindowText).
  const windowText = revenueWindowText(preset, query.data ? { from: query.data.from, to: query.data.to } : undefined);
  const metricLabel = METRICS.find((item) => item.value === metric)!.label;
  const isCount = metric === "COUNT";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Doanh thu theo Sub-merchant</CardTitle>
            <p className="text-[13px] text-muted-foreground">
              {windowText}, theo ngày thanh toán. Thực nhận = doanh thu gộp trừ phí; chưa trừ hoàn tiền.
            </p>
          </div>
          <div className="sm:w-64">
            <SubMerchantFilterField allowAll value={subMerchantId} onChange={setSubMerchantId} />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <ToggleGroup
            type="single"
            aria-label="Kỳ xem doanh thu"
            value={[preset]}
            // A single group can be cleared by clicking the active item; keep the current choice then.
            onValueChange={(next) => next[0] && setPreset(next[0] as RevenuePreset)}
          >
            {PRESETS.map((item) => (
              <ToggleGroupItem key={item.value} value={item.value}>
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup
            type="single"
            aria-label="Chỉ số biểu đồ"
            value={[metric]}
            onValueChange={(next) => next[0] && setMetric(next[0] as RevenueMetric)}
          >
            {METRICS.map((item) => (
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
          const chart = buildRevenueChart(query.data.points, periods, query.data.granularity, metric);
          const { subs, total } = totalsBySub(query.data.points);
          const shown = isCount ? total.transactionCount : metric === "NET" ? total.netAmount : total.grossAmount;
          return (
            <>
              <SummaryTiles total={total} />
              <div
                role="img"
                aria-label={`${metricLabel} theo ngày, ${windowText}. Tổng ${isCount ? fullCount(shown) : formatAmount(shown)}`}
              >
                <ChartBar
                  data={chart.rows}
                  xKey="label"
                  series={chart.series}
                  stacked
                  height={300}
                  allowDecimals={!isCount}
                  totalKey="total"
                  axisFormatter={isCount ? (value) => value.toLocaleString("vi-VN") : compactAmount}
                  tooltipFormatter={isCount ? fullCount : fullAmount}
                />
              </div>
              <Table data={subs} columns={COLUMNS} pagination={false} />
            </>
          );
        })()}
      </CardContent>
    </Card>
  );
}
