"use client";
import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card/Card";
import { Button } from "@/components/ui/button/Button";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { ChartArea, ChartBar, ChartLine, Line } from "@/components/ui/chart/Chart";
import { cn } from "@/lib/utils/cn";
import { useRevenueChartQuery } from "../hooks/use-revenue-chart-query";
import type { ChartPeriod } from "../types/Dashboard.type";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui";

const PERIODS: { value: ChartPeriod; label: string }[] = [
  { value: "daily", label: "Ngày" },
  { value: "weekly", label: "Tuần" },
  { value: "monthly", label: "Tháng" },
  { value: "yearly", label: "Năm" },
];

const SERIES = [{ key: "revenue", name: "Doanh thu (triệu đ)" }];

const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export default function RevenueChart() {
  const [period, setPeriod] = React.useState<ChartPeriod>("monthly");
  const { data, isLoading } = useRevenueChartQuery({ period });

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
            ) : (
              <div className="mt-1.5 flex items-center gap-3 text-sm">
                <span className="font-semibold text-foreground">
                  {formatVnd(data?.summary.totalRevenue ?? 0)}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {(data?.summary.totalTransactions ?? 0).toLocaleString(
                    "vi-VN",
                  )}{" "}
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
                  {Math.abs(data?.summary.growthRate ?? 0)}%
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-1 shrink-0">
            <Tabs defaultValue={period}>
              <TabsList className='flex bg-secondary' size="xs">
                {PERIODS.map((p) => (
                  <TabsTrigger 
                    key={p.value}
                    value={p.value}
                    onClick={() => setPeriod(p.value)}
                  >
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {/* {PERIODS.map((p) => (
              <Button
                key={p.value}
                size="sm"
                variant={period === p.value ? "secondary" : "ghost"}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))} */}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-2">
        {isLoading ? (
          <Skeleton className="h-[280px] w-full rounded-md" />
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
