import "server-only";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { ok } from "@/lib/http/result";
import { holdCalendarSchema, holdItemSchema } from "@/features/hold-calendar/schemas";
import type { HoldCalendar, HoldItemFilter, HoldItemPage, HoldRange } from "@/features/hold-calendar/types";

// Merchant Portal endpoint: a Sub is readable by a session holding it or its Master; otherwise 404. Mục 14 (BE MR A):
// không truyền Sub = mọi Sub trong phạm vi phiên (`/hold-calendar`, `/hold-calendar/items`).
const HOLD_CALENDAR = "/api/v1/merchant/hold-calendar";

const base = (subMerchantId: string | undefined) => (subMerchantId ? `${HOLD_CALENDAR}/${encodeURIComponent(subMerchantId)}` : HOLD_CALENDAR);

export function getHoldCalendar(subMerchantId: string | undefined, range: HoldRange): Promise<BeResult<HoldCalendar>> {
  return merchantClient().get({ path: base(subMerchantId), schema: holdCalendarSchema, query: { range } });
}

/** Từng khoản tạm giữ; trang của BE bắt đầu từ 1 như các danh sách Portal khác. */
export async function listHoldItems(filter: HoldItemFilter): Promise<BeResult<HoldItemPage>> {
  const result = await merchantClient().get({
    path: `${base(filter.subMerchantId)}/items`,
    schema: pageSchema(holdItemSchema),
    query: { state: filter.state, from: filter.from, to: filter.to, page: filter.page, size: filter.pageSize },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}
