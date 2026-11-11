import type { RevenueGranularity, RevenuePoint, RevenuePreset } from "../schemas/revenue.schema";
import { lastDays, vnDay } from "./order-week";

/** Chart colours cycle through the system chart tokens, so they follow the theme. */
const SUB_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const PRESET_DAYS: Partial<Record<RevenuePreset, number>> = { DAY_7: 7, DAY_15: 15, DAY_30: 30 };

export type RevenueRange = { from: string; to: string; periods: string[]; granularity: RevenueGranularity };

/** Every day from `from` to `to` inclusive (`yyyy-MM-dd`). */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  for (let time = Date.parse(from); time <= Date.parse(to); time += 86_400_000) days.push(new Date(time).toISOString().slice(0, 10));
  return days;
}

/**
 * Dates of a preset, from `today` (a Vietnam `yyyy-MM-dd`). Always charted by day: the last 7/15/30 days, this
 * month (1st to today) or the whole previous month. The BE caps a day range at 92 days, well above any of these.
 */
export function revenueRange(preset: RevenuePreset, today: string): RevenueRange {
  const count = PRESET_DAYS[preset];
  if (count) {
    const periods = lastDays(today, count);
    return { from: periods[0] as string, to: today, periods, granularity: "DAY" };
  }
  const [year = 0, month = 1] = today.split("-").map(Number);
  const first = preset === "THIS_MONTH" ? Date.UTC(year, month - 1, 1) : Date.UTC(year, month - 2, 1);
  const from = new Date(first).toISOString().slice(0, 10);
  // Day 0 of the next month = last day of this one; this month stops at today instead of listing future days.
  const to = preset === "THIS_MONTH" ? today : new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10);
  return { from, to, periods: daysBetween(from, to), granularity: "DAY" };
}

/** Subtitle wording for the period on screen, so it never claims "30 ngày" while showing a month. */
export function revenueWindowText(preset: RevenuePreset, bounds?: { from: string; to: string }): string {
  const count = PRESET_DAYS[preset];
  if (count) return `${count} ngày gần nhất`;
  // Once the response is in, its own from/to name the period: the server's "today" may differ from this browser's
  // around Vietnam midnight, and the label must match the data shown.
  const range = bounds ?? revenueRange(preset, vnDay(new Date().toISOString()) ?? "");
  const [year, month] = range.from.split("-");
  const label = `Tháng ${month}/${year}`;
  return preset === "THIS_MONTH" ? `${label} (từ ${periodLabel(range.from, "DAY")} đến ${periodLabel(range.to, "DAY")})` : label;
}

/** `dd/MM` for a day, `MM/yyyy` for a month. */
export function periodLabel(period: string, granularity: RevenueGranularity): string {
  const [year, month, day] = period.split("-");
  return granularity === "DAY" ? `${day}/${month}` : `${month}/${year}`;
}

const subName = (point: RevenuePoint) => point.subMerchantName ?? point.subMerchantCode ?? point.subMerchantId;

/** What the chart stacks: gross paid by customers, net recognised to the Sub, or the number of payments. */
export type RevenueMetric = "GROSS" | "NET" | "COUNT";

const metricValue = (point: RevenuePoint, metric: RevenueMetric) =>
  metric === "COUNT" ? point.transactionCount : metric === "NET" ? point.netAmount : point.grossAmount;

/**
 * One row per period, zero where a Sub had no payment (the BE only returns periods with payments), one stacked
 * series per Sub and the column `total` printed above each stack. Every Sub of a day lands in the same column, so a
 * day reads as one bar split by Sub (yêu cầu 11/11/2026). Series are ordered by Sub code so a Sub keeps its colour
 * whichever Sub happens to be paid first in the period.
 */
export function buildRevenueChart(
  points: RevenuePoint[],
  periods: string[],
  granularity: RevenueGranularity,
  metric: RevenueMetric = "GROSS",
) {
  const subs = [...new Map(points.map((point) => [point.subMerchantId, point])).values()].sort((a, b) =>
    (a.subMerchantCode ?? subName(a)).localeCompare(b.subMerchantCode ?? subName(b)),
  );
  const series = subs.map((sub, index) => ({
    key: `sub_${index}`,
    name: subName(sub),
    color: SUB_COLORS[index % SUB_COLORS.length] as string,
    id: sub.subMerchantId,
  }));
  const rows = periods.map((period) => {
    const row: Record<string, string | number> = { label: periodLabel(period, granularity), period, total: 0 };
    for (const item of series) {
      const found = points.find((point) => point.period === period && point.subMerchantId === item.id);
      const value = found ? metricValue(found, metric) : 0;
      row[item.key] = value;
      row.total = (row.total as number) + value;
    }
    return row;
  });
  return { rows, series: series.map(({ key, name, color }) => ({ key, name, color })) };
}

/** Short axis/label amount in Vietnamese notation: 90k, 1,5tr, 1,3 tỷ (đủ đọc nhanh, số đủ nằm ở tooltip/bảng). */
export function compactAmount(value: number): string {
  const short = (divided: number) => divided.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  const size = Math.abs(value);
  if (size >= 1_000_000_000) return `${short(value / 1_000_000_000)} tỷ`;
  if (size >= 1_000_000) return `${short(value / 1_000_000)}tr`;
  if (size >= 1_000) return `${short(value / 1_000)}k`;
  return String(value);
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
