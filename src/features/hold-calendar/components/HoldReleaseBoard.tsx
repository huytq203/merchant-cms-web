"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResultState } from "@/components/page/ResultState";
import { ChartBar } from "@/components/ui/chart/Chart";
import { Switch } from "@/components/ui/switch/Switch";
import { Table } from "@/components/ui/table/Table";
import { shiftVnDate } from "@/lib/utils/vn-time";
import { holdItemColumns } from "../columns/HoldItemColumn";
import { HOLD_RANGE_DAYS } from "../constants/hold-labels";
import { holdCalendarQueries } from "../hold-calendar-queries";
import type { HoldCalendar, HoldItemFilter } from "../types";

interface Props {
  calendar: HoldCalendar;
  today: string;
  /** Không có = mọi Sub trong phạm vi phiên. */
  subMerchantId?: string;
}

const PAGE_SIZE = 20;
const ddMM = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/**
 * Bộ lọc gửi BE: tắt toggle = chỉ khoản đang giữ tới hết kỳ; bật = mọi trạng thái từ đầu cửa sổ nhìn lùi (`pastFrom`)
 * tới hết kỳ. Kỳ "Tất cả" không giới hạn ngày.
 */
export function itemFilter(calendar: HoldCalendar, today: string, showReleased: boolean, page: number, subMerchantId?: string): HoldItemFilter {
  const days = HOLD_RANGE_DAYS[calendar.range];
  return {
    ...(subMerchantId ? { subMerchantId } : {}),
    state: showReleased ? "ALL" : "HOLDING",
    ...(showReleased && days !== null ? { from: calendar.pastFrom ?? shiftVnDate(today, 1 - days) } : {}),
    ...(days !== null ? { to: shiftVnDate(today, days - 1) } : {}),
    page,
    pageSize: PAGE_SIZE,
  };
}

/**
 * Dữ liệu cột: "Sẽ giải phóng" từ lịch của BE, "Đã giải phóng" từ `releasedByDay` của BE (đủ cả cửa sổ đã qua, khớp ô
 * "Đã giải phóng"); cột xám chỉ hiện khi bật toggle.
 */
export function chartRows(calendar: HoldCalendar, showReleased: boolean) {
  const byDay = new Map<string, { upcoming: number; released: number }>();
  for (const day of calendar.days) byDay.set(day.date, { upcoming: day.amount, released: 0 });
  if (showReleased) {
    for (const day of calendar.releasedByDay) {
      const entry = byDay.get(day.date) ?? { upcoming: 0, released: 0 };
      entry.released += day.amount;
      byDay.set(day.date, entry);
    }
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => ({ day: ddMM(day), "Đã giải phóng": value.released, "Sẽ giải phóng": value.upcoming }));
}

/** Biểu đồ cột và danh sách từng khoản tạm giữ, với toggle "Hiện khoản đã giải phóng" (mục 14). */
export function HoldReleaseBoard({ calendar, today, subMerchantId }: Props) {
  const [showReleased, setShowReleased] = useState(false);
  const [page, setPage] = useState(1);
  const items = useQuery(holdCalendarQueries.items(itemFilter(calendar, today, showReleased, page, subMerchantId)));
  const rows = chartRows(calendar, showReleased);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="hold-items" className="text-base font-semibold">Các khoản tạm giữ</h2>
        <Switch
          label="Hiện khoản đã giải phóng"
          checked={showReleased}
          onCheckedChange={(checked) => {
            setShowReleased(checked);
            setPage(1);
          }}
        />
      </div>
      {rows.length > 0 ? (
        <figure className="space-y-1">
          <ChartBar
            data={rows}
            xKey="day"
            stacked
            height={200}
            series={[
              { key: "Đã giải phóng", color: "var(--muted-foreground)" },
              { key: "Sẽ giải phóng", color: "var(--primary)" },
            ]}
          />
          <figcaption className="text-xs text-muted-foreground">
            Cột xanh: sẽ giải phóng theo lịch. Cột xám: đã giải phóng (khi bật hiện khoản đã giải phóng).
          </figcaption>
        </figure>
      ) : null}
      {items.isPending ? <ResultState state="loading" loadingLabel="Đang tải các khoản tạm giữ" /> : null}
      {items.isError ? <ResultState state="error" errorMessage={items.error.message} onRetry={() => void items.refetch()} /> : null}
      {items.data ? (
        <div className="max-w-full overflow-x-auto">
          <Table
            data={items.data.rows}
            columns={holdItemColumns(today)}
            labels={{ empty: showReleased ? "Không có khoản tạm giữ nào trong kỳ" : "Không có khoản nào đang giữ trong kỳ" }}
            pagination={items.data.total > PAGE_SIZE ? { total: items.data.total, current: page, pageSize: PAGE_SIZE, onChange: (next) => setPage(next) } : false}
          />
        </div>
      ) : null}
    </div>
  );
}
