import type { z } from "zod";
import type { holdCalendarSchema, holdRangeSchema } from "./schemas";

export type HoldCalendar = z.infer<typeof holdCalendarSchema>;
export type HoldDay = HoldCalendar["days"][number];
export type HoldRange = z.infer<typeof holdRangeSchema>;
