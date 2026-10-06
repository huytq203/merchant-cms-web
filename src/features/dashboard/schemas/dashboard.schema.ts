import { z } from "zod";
import { cardTypeSchema, transactionStatusSchema } from "@/features/transactions/schemas/transaction.schema";

export const chartPeriodSchema = z.enum(["7days", "30days", "thisMonth"]);

export const revenueDataPointSchema = z.object({
  label: z.string(),
  /** VND */
  revenue: z.number(),
  transactions: z.number().int().min(0),
});

export const revenueSummarySchema = z.object({
  /** VND */
  totalRevenue: z.number(),
  totalTransactions: z.number().int().min(0),
  /** Percent; positive means growth. */
  growthRate: z.number(),
});

export const revenueChartSchema = z.object({
  points: z.array(revenueDataPointSchema),
  summary: revenueSummarySchema,
});

/** Headline numbers; every `*ChangePercent` is the change versus the previous period. */
export const dashboardSummarySchema = z.object({
  balance: z.number(),
  balanceChangePercent: z.number(),
  revenueToday: z.number(),
  revenueChangePercent: z.number(),
  successfulTransactionsToday: z.number().int().min(0),
  successfulTransactionsChangePercent: z.number(),
  conversionRatePercent: z.number().min(0).max(100),
  conversionChangePercent: z.number(),
  masterMerchantCount: z.number().int().min(0),
  subMerchantCount: z.number().int().min(0),
  terminalCount: z.number().int().min(0),
});

export const recentTransactionSchema = z.object({
  id: z.string(),
  code: z.string(),
  customerName: z.string(),
  cardType: cardTypeSchema,
  amount: z.number(),
  createdAt: z.string(),
  status: transactionStatusSchema,
});

export const dashboardOverviewSchema = z.object({
  summary: dashboardSummarySchema,
  recentTransactions: z.array(recentTransactionSchema),
});

/** Query of the chart route and of the chart query key. */
export const revenueChartQuerySchema = z.object({
  period: chartPeriodSchema.default("7days"),
});
