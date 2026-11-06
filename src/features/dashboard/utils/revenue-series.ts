import type { RevenueGranularity, RevenuePoint } from "../schemas/revenue.schema";
import { lastDays } from "./order-week";

/** Days shown by day and months shown by month: the latest window, ending today. */
export const REVENUE_DAYS = 30;
export const REVENUE_MONTHS = 12;

/** Chart colours cycle through the system chart tokens, so they follow the theme. */
const SUB_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export type RevenueRange = { from: string; to: string; periods: string[] };

/** The latest 30 days or 12 months ending on `today` (a Vietnam `yyyy-MM-dd`), and each period in it. */
export function revenueRange(granularity: RevenueGranularity, today: string): RevenueRange {
  if (granularity === "DAY") {
    const periods = lastDays(today, REVENUE_DAYS);
    return { from: periods[0] as string, to: today, periods };
  }
  const [year = 0, month = 1] = today.split("-").map(Number);
  const periods = Array.from({ length: REVENUE_MONTHS }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (REVENUE_MONTHS - 1 - index), 1));
    return date.toISOString().slice(0, 7);
  });
  return { from: `${periods[0]}-01`, to: today, periods };
}

/** `dd/MM` for a day, `MM/yyyy` for a month. */
export function periodLabel(period: string, granularity: RevenueGranularity): string {
  const [year, month, day] = period.split("-");
  return granularity === "DAY" ? `${day}/${month}` : `${month}/${year}`;
}

const subName = (point: RevenuePoint) => point.subMerchantName ?? point.subMerchantCode ?? point.subMerchantId;

/**
 * One row per period, zero where a Sub had no payment (the BE only returns periods with payments), and one
 * stacked series of gross amount per Sub, in the order the Subs first appear.
 */
export function buildRevenueChart(points: RevenuePoint[], periods: string[], granularity: RevenueGranularity) {
  const subs = [...new Map(points.map((point) => [point.subMerchantId, subName(point)])).entries()];
  const series = subs.map(([id, name], index) => ({ key: `sub_${index}`, name, color: SUB_COLORS[index % SUB_COLORS.length] as string, id }));
  const rows = periods.map((period) => {
    const row: Record<string, string | number> = { label: periodLabel(period, granularity) };
    for (const item of series) {
      row[item.key] = points.find((point) => point.period === period && point.subMerchantId === item.id)?.grossAmount ?? 0;
    }
    return row;
  });
  return { rows, series: series.map(({ key, name, color }) => ({ key, name, color })) };
}

export type RevenueTotals = { transactionCount: number; grossAmount: number; feeAmount: number; netAmount: number };
export type SubRevenueTotals = RevenueTotals & { subMerchantId: string; subMerchantCode: string | null; subMerchantName: string };

const ZERO: RevenueTotals = { transactionCount: 0, grossAmount: 0, feeAmount: 0, netAmount: 0 };

function add(into: RevenueTotals, point: RevenueTotals): RevenueTotals {
  return {
    transactionCount: into.transactionCount + point.transactionCount,
    grossAmount: into.grossAmount + point.grossAmount,
    feeAmount: into.feeAmount + point.feeAmount,
    netAmount: into.netAmount + point.netAmount,
  };
}

/** Each Sub summed over the whole range, biggest gross first, and the grand total of every Sub. */
export function totalsBySub(points: RevenuePoint[]): { subs: SubRevenueTotals[]; total: RevenueTotals } {
  const bySub = new Map<string, SubRevenueTotals>();
  for (const point of points) {
    const current = bySub.get(point.subMerchantId) ?? {
      ...ZERO,
      subMerchantId: point.subMerchantId,
      subMerchantCode: point.subMerchantCode ?? null,
      subMerchantName: subName(point),
    };
    bySub.set(point.subMerchantId, { ...current, ...add(current, point) });
  }
  const subs = [...bySub.values()].sort((a, b) => b.grossAmount - a.grossAmount);
  return { subs, total: subs.reduce<RevenueTotals>((sum, sub) => add(sum, sub), ZERO) };
}
