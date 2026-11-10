import { z } from "zod";

/** Bucket size of the revenue series: Vietnam calendar day or month of payment. */
export const revenueGranularitySchema = z.enum(["DAY", "MONTH"]);

/** One Sub's revenue in one period, as `GET /api/v1/merchant/revenue-stats` returns it. */
export const revenuePointSchema = z.object({
  subMerchantId: z.uuid(),
  subMerchantCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  /** `yyyy-MM-dd` by day, `yyyy-MM` by month. */
  period: z.string(),
  transactionCount: z.number().int(),
  /** What customers paid. */
  grossAmount: z.number().int(),
  /** MDR fee. */
  feeAmount: z.number().int(),
  /** Recognised to the Sub: gross minus fee. */
  netAmount: z.number().int(),
});

export const revenueSeriesSchema = z.object({
  granularity: revenueGranularitySchema,
  from: z.iso.date(),
  to: z.iso.date(),
  points: z.array(revenuePointSchema),
});

/**
 * Period the dashboard card views (chốt 10/11/2026). Day mode: the latest 7 (default), 15 or 30 days. Month mode:
 * this month or last month, always charted by the days of that month.
 */
export const revenuePresetSchema = z.enum(["DAY_7", "DAY_15", "DAY_30", "THIS_MONTH", "LAST_MONTH"]);

/** Query of the dashboard route: the client names the preset, the server turns it into dates (one "today"). */
export const revenueQuerySchema = z.object({
  preset: revenuePresetSchema,
  subMerchantId: z.uuid().optional(),
});

export type RevenuePreset = z.infer<typeof revenuePresetSchema>;
export type RevenueGranularity = z.infer<typeof revenueGranularitySchema>;
export type RevenuePoint = z.infer<typeof revenuePointSchema>;
export type RevenueSeries = z.infer<typeof revenueSeriesSchema>;
export type RevenueQuery = z.infer<typeof revenueQuerySchema>;
