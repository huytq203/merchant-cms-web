import { ORDER_BUCKETS, type OrderBucket } from "../constants/order-buckets";
import type { OrderStatus } from "@/features/orders/types/types";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;
const DAY_FORMAT = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });

export type OrderWeekRow = { status: OrderStatus; amount: number; createdAt?: string | null };

export type OrderDay = { day: string; label: string } & Record<OrderBucket, number>;

export type OrderWeek = {
  days: OrderDay[];
  totals: Record<OrderBucket, number>;
  count: number;
  /** Money from orders in the `paid` bucket. */
  revenue: number;
};

/** Calendar day (`yyyy-MM-dd`) in Vietnam, where merchants read "today"; null when the time is missing or invalid. */
export function vnDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const time = new Date(iso);
  return Number.isNaN(time.getTime()) ? null : DAY_FORMAT.format(time);
}

/** `yyyy-MM-dd` as numbers; the input always comes from `vnDay` or `lastDays`. */
function splitDay(day: string): [number, number, number] {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  return [year, month, date];
}

export function lastDays(today: string, count: number): string[] {
  const [year, month, day] = splitDay(today);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day - (count - 1 - index)));
    return date.toISOString().slice(0, 10);
  });
}

export function bucketOf(status: OrderStatus): OrderBucket {
  return ORDER_BUCKETS.find((bucket) => bucket.statuses.includes(status))?.key ?? "closed";
}

function labelOf(day: string): string {
  const [year, month, date] = splitDay(day);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, date)).getUTCDay()];
  return `${weekday} ${String(date).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

export function summarizeWeek(rows: readonly OrderWeekRow[], days: readonly string[]): OrderWeek {
  const byDay = new Map<string, OrderDay>(
    days.map((day) => [day, { day, label: labelOf(day), paid: 0, waiting: 0, failed: 0, closed: 0 }]),
  );
  const totals: Record<OrderBucket, number> = { paid: 0, waiting: 0, failed: 0, closed: 0 };
  let count = 0;
  let revenue = 0;
  for (const row of rows) {
    const bucket = byDay.get(vnDay(row.createdAt) ?? "");
    if (!bucket) continue;
    const key = bucketOf(row.status);
    bucket[key] += 1;
    totals[key] += 1;
    count += 1;
    if (key === "paid") revenue += row.amount;
  }
  return { days: days.map((day) => byDay.get(day) as OrderDay), totals, count, revenue };
}
