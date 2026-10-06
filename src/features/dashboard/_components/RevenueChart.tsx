"use client";
import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card/Card";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { ChartArea } from "@/components/ui/chart/Chart";
import { cn } from "@/lib/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { ModuleQueryError } from "@/features/sample-data/components/ModuleQueryError";
import { dashboardQueries } from "../dashboard-queries";
import { chartPeriodSchema } from "../schemas/dashboard.schema";
import type { ChartPeriod } from "../types/Dashboard.type";
import { Select } from "@/components/ui/select/Select";

const PERIODS: { value: ChartPeriod; label: string }[] = [
  { value: "7days", label: "7 ngày qua" },
  { value: "30days", label: "30 ngày qua" },
  { value: "thisMonth", label: "Tháng này" },
];

const SERIES = [{ key: "revenue", name: "Doanh thu (triệu đ)" }];

const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export default function RevenueChart() {
  const [period, setPeriod] = React.useState<ChartPeriod>("7days");
  const { data, isLoading, isError, error, refetch } = useQuery(dashboardQueries.revenueChart(period));

  const chartData = React.useMemo(
    () =>
      data?.points.map((p) => ({ ...p, revenue: p.revenue / 1_000_000 })) ?? [],
    [data],
  );

  const isGrowthPositive = (data?.summary.growthRate ?? 0) >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Xu hướng doanh thu</CardTitle>
            {isLoading ? (
              <Skeleton className="mt-1.5 h-4 w-48" />
            ) : data ? (
              <div className="mt-1.5 flex items-center gap-3 text-sm">
                <span className="font-semibold text-foreground">
                  {formatVnd(data.summary.totalRevenue)}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {data.summary.totalTransactions.toLocaleString("vi-VN")}{" "}
                  giao dịch
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium",
                    isGrowthPositive ? "text-success" : "text-danger",
                  )}
                >
                  {isGrowthPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {Math.abs(data.summary.growthRate)}%
                </span>
              </div>
            ) : null}
          </div>

          <div className="w-40 shrink-0">
            <Select
              aria-label="Kỳ biểu đồ doanh thu"
              placeholder="Chọn kỳ"
              value={period}
              options={PERIODS}
              onChange={(value) => {
                const selected = chartPeriodSchema.safeParse(value);
                if (selected.success) setPeriod(selected.data);
              }}
              clearable={false}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-2">
        {isLoading ? (
          <Skeleton className="h-[280px] w-full rounded-md" />
        ) : isError ? (
          <ModuleQueryError error={error} onRetry={() => void refetch()} />
        ) : (
          <ChartArea
            data={chartData}
            xKey="label"
            series={SERIES}
            height={280}
          />
        )}
      </CardContent>
    </Card>
  );
}
