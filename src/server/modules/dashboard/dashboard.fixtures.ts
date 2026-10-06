import type {
  ChartPeriod,
  DashboardOverview,
  RecentTransaction,
  RevenueChartResponse,
} from "@/features/dashboard/types/Dashboard.type";
import type { CardType, TransactionStatus } from "@/features/transactions/types";

/**
 * Static sample data for development (MERCHANT_API_MODE=fixture). Nothing here is real:
 * customers are placeholders and every number is made up.
 */
const RECENT_STATUSES: readonly TransactionStatus[] = ["success", "success", "pending", "success", "failed", "success"];
const RECENT_CARDS: readonly CardType[] = ["visa", "mastercard", "napas", "amex"];
const RECENT_BASE_TIME = Date.UTC(2026, 8, 30, 8, 0, 0);
const MINUTE_MS = 60_000;

function sampleRecentTransaction(index: number): RecentTransaction {
  const number = String(index + 1).padStart(3, "0");
  return {
    id: `sample-trx-${number}`,
    code: `TRX-SAMPLE-${number}`,
    customerName: `Khách hàng mẫu ${number}`,
    cardType: RECENT_CARDS[index % RECENT_CARDS.length]!,
    amount: (index + 1) * 150_000,
    createdAt: new Date(RECENT_BASE_TIME - index * 17 * MINUTE_MS).toISOString(),
    status: RECENT_STATUSES[index % RECENT_STATUSES.length]!,
  };
}

export const DASHBOARD_OVERVIEW_FIXTURE: DashboardOverview = {
  summary: {
    balance: 1_250_000_000,
    balanceChangePercent: 12,
    revenueToday: 45_800_000,
    revenueChangePercent: 5,
    successfulTransactionsToday: 1204,
    successfulTransactionsChangePercent: -2,
    conversionRatePercent: 94.2,
    conversionChangePercent: 0.5,
    masterMerchantCount: 1,
    subMerchantCount: 6,
    terminalCount: 24,
  },
  recentTransactions: Array.from({ length: 6 }, (_, index) => sampleRecentTransaction(index)),
};

type ChartSeed = { labels: readonly string[]; baseRevenue: number; growthRate: number };

const CHART_SEEDS: Record<ChartPeriod, ChartSeed> = {
  '7days': {
    labels: ["01/09", "02/09", "03/09", "04/09", "05/09", "06/09", "07/09"],
    baseRevenue: 38_000_000,
    growthRate: 4.2,
  },
  '30days': {
    labels: Array.from({ length: 30 }, (_, index) => `${String(index + 1).padStart(2, '0')}/09`),
    baseRevenue: 38_000_000,
    growthRate: 2.8,
  },
  thisMonth: {
    labels: Array.from({ length: 31 }, (_, index) => `${String(index + 1).padStart(2, '0')}/10`),
    baseRevenue: 40_000_000,
    growthRate: 8.5,
  },
};

const AVERAGE_TICKET = 250_000;

function buildChart({ labels, baseRevenue, growthRate }: ChartSeed): RevenueChartResponse {
  const points = labels.map((label, index) => {
    const revenue = Math.round((baseRevenue * (1 + (index % 4) * 0.12 + index * 0.03)) / 1000) * 1000;
    return { label, revenue, transactions: Math.round(revenue / AVERAGE_TICKET) };
  });
  return {
    points,
    summary: {
      totalRevenue: points.reduce((sum, point) => sum + point.revenue, 0),
      totalTransactions: points.reduce((sum, point) => sum + point.transactions, 0),
      growthRate,
    },
  };
}

export const REVENUE_CHART_FIXTURES: Record<ChartPeriod, RevenueChartResponse> = {
  '7days': buildChart(CHART_SEEDS['7days']),
  '30days': buildChart(CHART_SEEDS['30days']),
  thisMonth: buildChart(CHART_SEEDS.thisMonth),
};
