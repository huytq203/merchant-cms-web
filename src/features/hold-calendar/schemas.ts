import { z } from "zod";

/** The only ranges the BE accepts; any other value makes it answer 500, so the FE never sends one. */
export const holdRangeSchema = z.enum(["DAYS_7", "DAYS_30", "DAYS_90", "ALL"]);

const holdDaySchema = z.object({
  date: z.string(),
  weekday: z.string(),
  count: z.number().int(),
  amount: z.number(),
  cumulativeReleased: z.number(),
  remainingHeld: z.number(),
});

/** `GET /api/v1/merchant/hold-calendar/{subMerchantId}?range=`; overdue holds still held are folded into today's row. */
export const holdCalendarSchema = z.object({
  range: holdRangeSchema,
  totalHeld: z.number(),
  releasedInPeriod: z.number(),
  heldAfterPeriod: z.number(),
  peak: z.object({ date: z.string(), amount: z.number() }).nullable(),
  days: z.array(holdDaySchema),
  reconciles: z.boolean(),
  ledgerHeld: z.number().nullable(),
  notes: z.array(z.string()),
  asOf: z.string(),
});
