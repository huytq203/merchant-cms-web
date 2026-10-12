// ─── Chart design tokens: system CSS variables, so charts follow the theme ───

export const CHART_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)',
] as const;

/** Axis tick style */
export const CHART_AX  = { fontSize: 12, fill: 'var(--muted-foreground)' } as const;

/** Cartesian grid style */
export const CHART_GRD = { stroke: 'var(--border)', strokeDasharray: '4 4' } as const;

// ─── Shared prop types ────────────────────────────────────────────────────────

export type SeriesItem = {
  key: string;
  name?: string;
  color?: string;
  stackId?: string;
};

export type PieDataItem = {
  name: string;
  value: number;
  color?: string;
};

/** Dữ liệu trả về khi onClick trên các chart
 *  - activeLabel : giá trị trục X (category) tại vị trí click
 *  - activeIndex : vị trí trong mảng data
 *  - dataKey     : key của series được click (line/area/bar cụ thể)
 *  - payload     : toàn bộ row data tại vị trí đó (data[activeIndex])
 */
export type ChartClickEvent = {
  activeLabel?: string | number;
  activeIndex?: number;
  dataKey?: string;
  payload?: Record<string, unknown>;
};
