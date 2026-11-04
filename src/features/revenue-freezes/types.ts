import type { z } from "zod";
import type { freezeReleaseStatusSchema, freezeSchema, freezeStatusFilterSchema, freezeStatusSchema } from "./schemas";

export type RevenueFreeze = z.infer<typeof freezeSchema>;
export type FreezeRelease = RevenueFreeze["releases"][number];
export type FreezeStatus = z.infer<typeof freezeStatusSchema>;
export type FreezeStatusFilter = z.infer<typeof freezeStatusFilterSchema>;
export type FreezeReleaseStatus = z.infer<typeof freezeReleaseStatusSchema>;
