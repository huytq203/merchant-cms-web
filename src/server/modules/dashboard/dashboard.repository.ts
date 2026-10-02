"server-only";

import { prisma } from "@/lib/db/prisma";
import type { PeriodType, TransactionStatus } from "@prisma/client";

export interface RecentTransaction {
  id: string;
  code: string;
  customerName: string;
  amount: number;
  createdAt: string;
  status: string;
  cardType: string;
  cardNumber: string;
  bankCode: string;
}

export interface ChartDataPoint {
  label: string;
  revenue: number;
  transactions: number;
}

export interface ChartSummary {
  totalRevenue: number;
  totalTransactions: number;
  growthRate: number;
}

export interface FindDashboardParams {
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function findRecentTransactions(params: FindDashboardParams): Promise<{
  data: RecentTransaction[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { keyword = "", status = "", page = 1, pageSize = 10 } = params;

  const where = {
    ...(keyword && {
      OR: [
        { code: { contains: keyword } },
        { customerName: { contains: keyword } },
      ],
    }),
    ...(status && { status: status as TransactionStatus }),
  };

  const [total, rows] = await Promise.all([
    prisma.dashboardRecentTransaction.count({ where }),
    prisma.dashboardRecentTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    data: rows.map((r) => ({
      id: r.id,
      code: r.code,
      customerName: r.customerName,
      amount: Number(r.amount),
      createdAt: r.createdAt.toISOString(),
      status: r.status,
      cardType: r.cardType,
      cardNumber: r.cardNumber,
      bankCode: r.bankCode,
    })),
    pagination: { page, pageSize, total },
  };
}

export async function findChartData(
  period: string,
): Promise<{ points: ChartDataPoint[]; summary: ChartSummary }> {
  const rows = await prisma.chartData.findMany({
    where: { periodType: period as PeriodType },
    orderBy: { id: "asc" },
  });

  const points = rows.map((r) => ({
    label: r.label,
    revenue: Number(r.revenue),
    transactions: r.transactions,
  }));

  const first = rows[0];
  const summary: ChartSummary = first
    ? {
        totalRevenue: Number(first.totalRevenue),
        totalTransactions: first.totalTransactions,
        growthRate: Number(first.growthRate),
      }
    : { totalRevenue: 0, totalTransactions: 0, growthRate: 0 };

  return { points, summary };
}
