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

/** Query of the dashboard route: the range is always the latest one, computed on the server. */
export const revenueQuerySchema = z.object({
  granularity: revenueGranularitySchema,
  subMerchantId: z.uuid().optional(),
});

export type RevenueGranularity = z.infer<typeof revenueGranularitySchema>;
export type RevenuePoint = z.infer<typeof revenuePointSchema>;
export type RevenueSeries = z.infer<typeof revenueSeriesSchema>;
export type RevenueQuery = z.infer<typeof revenueQuerySchema>;
