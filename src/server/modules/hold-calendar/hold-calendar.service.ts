import "server-only";

import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { holdCalendarSchema } from "@/features/hold-calendar/schemas";
import type { HoldCalendar, HoldRange } from "@/features/hold-calendar/types";

// Merchant Portal endpoint: a Sub is readable by a session holding it or its Master; otherwise 404.
const HOLD_CALENDAR = "/api/v1/merchant/hold-calendar";

export function getHoldCalendar(subMerchantId: string, range: HoldRange): Promise<BeResult<HoldCalendar>> {
  return merchantClient().get({
    path: `${HOLD_CALENDAR}/${encodeURIComponent(subMerchantId)}`,
    schema: holdCalendarSchema,
    query: { range },
  });
}
