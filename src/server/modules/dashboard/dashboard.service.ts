import "server-only";

import { cache } from "react";

import type { BeResult } from "@/lib/be/client";
import { ok } from "@/lib/http/result";
import { WAITING_STATUS } from "@/features/dashboard/constants/order-buckets";
import { lastDays, summarizeWeek, vnDay, type OrderWeek } from "@/features/dashboard/utils/order-week";
import type { Order } from "@/features/orders/types/types";
import type { Withdrawal } from "@/features/withdrawals/schemas/withdrawal.schema";
import { listOrders } from "@/server/modules/orders/order.service";
import { listTerminals } from "@/server/modules/terminals/terminal.service";
import { listWithdrawals } from "@/server/modules/withdrawals/withdrawal.service";

const WEEK_DAYS = 7;
/** The BE caps a page at 100 rows, so a week is read as two pages. */
const WEEK_PAGE_SIZE = 100;
const RECENT_COUNT = 5;

export type OrderSnapshot = {
  week: OrderWeek;
  /** More orders in the week than the two pages hold: the chart and revenue undercount. */
  truncated: boolean;
  today: number;
  yesterday: number;
  waiting: number;
  recent: Order[];
};

export type WithdrawalSnapshot = { recent: Withdrawal[]; pending: number };
export type TerminalSnapshot = { active: number; total: number };

/** BE has no summary endpoint: the numbers come from the list endpoints, which scope rows by the session. */
export async function loadOrderSnapshot(now: Date): Promise<BeResult<OrderSnapshot>> {
  const today = vnDay(now.toISOString()) as string;
  const days = lastDays(today, WEEK_DAYS);
  const [yesterday] = days.slice(-2);
  const week = { createdFrom: days[0], createdTo: today, pageSize: WEEK_PAGE_SIZE };
  const countOnly = { page: 1, pageSize: 1 };

  const [first, second, todayCount, yesterdayCount, waitingCount] = await Promise.all([
    listOrders({ page: 1, ...week }),
    listOrders({ page: 2, ...week }),
    listOrders({ ...countOnly, createdFrom: today, createdTo: today }),
    listOrders({ ...countOnly, createdFrom: yesterday, createdTo: yesterday }),
    listOrders({ ...countOnly, status: WAITING_STATUS }),
  ]);
  if (!first.success) return first;
  if (!second.success) return second;
  if (!todayCount.success) return todayCount;
  if (!yesterdayCount.success) return yesterdayCount;
  if (!waitingCount.success) return waitingCount;

  const rows = [...first.data.rows, ...second.data.rows];
  return ok({
    week: summarizeWeek(rows, days),
    truncated: first.data.total > rows.length,
    today: todayCount.data.total,
    yesterday: yesterdayCount.data.total,
    waiting: waitingCount.data.total,
    recent: first.data.rows.slice(0, RECENT_COUNT),
  });
}

export async function loadWithdrawalSnapshot(): Promise<BeResult<WithdrawalSnapshot>> {
  const [recent, pending] = await Promise.all([
    listWithdrawals({ page: 1, pageSize: RECENT_COUNT }),
    listWithdrawals({ page: 1, pageSize: 1, statusGroup: "PENDING" }),
  ]);
  if (!recent.success) return recent;
  if (!pending.success) return pending;
  return ok({ recent: recent.data.rows, pending: pending.data.total });
}

export async function loadTerminalSnapshot(): Promise<BeResult<TerminalSnapshot>> {
  const [active, total] = await Promise.all([
    listTerminals({ page: 1, pageSize: 1, status: "ACTIVE" }),
    listTerminals({ page: 1, pageSize: 1 }),
  ]);
  if (!active.success) return active;
  if (!total.success) return total;
  return ok({ active: active.data.total, total: total.data.total });
}

/** Regions share one request per page render: `cache` dedupes the calls within it. */
export const getOrderSnapshot = cache(() => loadOrderSnapshot(new Date()));
export const getWithdrawalSnapshot = cache(loadWithdrawalSnapshot);
export const getTerminalSnapshot = cache(loadTerminalSnapshot);
