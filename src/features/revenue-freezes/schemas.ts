import { z } from "zod";

/** Freeze states the BE stores (CHECK constraint of `merchant_revenue_freezes`, V89). */
export const freezeStatusSchema = z.enum(["PROCESSING", "ACTIVE", "RELEASED", "FAILED"]);

/** The status filter in the URL: one BE status, or ALL which sends no `status` at all. */
export const freezeStatusFilterSchema = z.enum(["ALL", ...freezeStatusSchema.options]);

/** Release states the BE stores (`merchant_revenue_freeze_releases`). */
export const freezeReleaseStatusSchema = z.enum(["PROCESSING", "SUCCEEDED", "FAILED"]);

/**
 * One release as the Portal sees it: amount, state and times only. The ledger outcome, the reason an admin typed and
 * whether the job made it are internal and not sent. `completedAt` is null while the ledger has not answered.
 */
const freezeReleaseSchema = z.object({
  amount: z.number(),
  status: freezeReleaseStatusSchema,
  createdAt: z.string(),
  completedAt: z.string().nullish().transform((value) => value ?? null),
});

/**
 * `GET /api/v1/merchant/revenue-freezes` (BE `PortalFreeze`): FlexPay holding back money of one settled order of a
 * Sub. `requested` is what FlexPay asked, `frozen` what the ledger could take, `shortfall` what is still owed and is
 * taken from new revenue (only meaningful while ACTIVE), `released` what was given back. Releases come newest first.
 */
export const freezeSchema = z.object({
  id: z.uuid(),
  freezeCode: z.string().nullish().transform((value) => value ?? null),
  orderId: z.uuid(),
  orderCode: z.string().nullish().transform((value) => value ?? null),
  requested: z.number(),
  frozen: z.number(),
  released: z.number(),
  shortfall: z.number(),
  reason: z.string().nullish().transform((value) => value ?? null),
  scheduledReleaseAt: z.string().nullish().transform((value) => value ?? null),
  status: freezeStatusSchema,
  createdAt: z.string(),
  releases: z.array(freezeReleaseSchema).nullish().transform((value) => value ?? []),
});

/** The BE answers a plain list (newest first, at most 500 rows), not a page. */
export const freezeListSchema = z.array(freezeSchema);
