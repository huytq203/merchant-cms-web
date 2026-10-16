import type { z } from "zod";
import type { subBalanceReportSchema } from "./schemas";

export type SubBalanceReport = z.infer<typeof subBalanceReportSchema>;
export type BalanceBucket = SubBalanceReport["available"];
