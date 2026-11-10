import type { z } from "zod";
import type { holdCalendarSchema, holdItemPageSchema, holdItemSchema, holdItemStateSchema, holdRangeSchema } from "./schemas";

export type HoldCalendar = z.infer<typeof holdCalendarSchema>;
export type HoldDay = HoldCalendar["days"][number];
export type HoldRange = z.infer<typeof holdRangeSchema>;
export type HoldItem = z.infer<typeof holdItemSchema>;
export type HoldItemState = z.infer<typeof holdItemStateSchema>;
export type HoldItemPage = z.infer<typeof holdItemPageSchema>;

/** Bộ lọc danh sách khoản: không có Sub = mọi Sub trong phạm vi; `state` ALL khi bật "Hiện khoản đã giải phóng". */
export interface HoldItemFilter {
  subMerchantId?: string;
  state: HoldItemState | "ALL";
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}
