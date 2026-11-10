"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { SegmentedControl } from "@/components/form/SegmentedControl";
import { FilterCard } from "@/components/page/FilterCard";
import { DatePicker, Input } from "@/components/ui";
import { SubMerchantFilterField } from "@/features/sample-data/components/SubMerchantFilterField";
import type { RefundFilter, RefundPeriod } from "../types";
import { DEFAULT_REFUND_PERIOD, REFUND_PERIOD_OPTIONS } from "../utils/refund-query";

interface Props {
  initial: RefundFilter;
  onSearch: (filter: RefundFilter) => void;
}

/** `yyyy-MM-dd` ↔ Date theo giờ máy: bộ chọn ngày làm việc với Date, BE nhận ngày lịch Việt Nam. */
const toDate = (iso?: string) => {
  if (!iso) return undefined;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year!, month! - 1, day);
};
const toIso = (date?: Date) =>
  date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : undefined;

/**
 * Kỳ (7 ngày mặc định / 30 ngày / tùy chỉnh), ô tìm một mã (mã hoàn tiền, mã giao dịch, mã đơn hàng) và Sub-merchant.
 * Nhóm trạng thái chọn ở dải đếm phía trên nên được giữ nguyên khi tìm; bộ lọc theo đơn từ màn Đơn hàng cũng giữ.
 */
export function RevenueRefundFilter({ initial, onSearch }: Props) {
  const [period, setPeriod] = useState<RefundPeriod>(initial.period ?? DEFAULT_REFUND_PERIOD);
  const [range, setRange] = useState<{ from?: string; to?: string }>({ from: initial.from, to: initial.to });
  const [q, setQ] = useState(initial.q ?? "");
  const [subMerchantId, setSubMerchantId] = useState(initial.subMerchantId ?? "");

  const submit = () => {
    const keep = { ...(initial.group ? { group: initial.group } : {}), ...(initial.status ? { status: initial.status } : {}), ...(initial.orderId ? { orderId: initial.orderId } : {}) };
    onSearch({
      ...keep,
      period,
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(subMerchantId ? { subMerchantId } : {}),
      ...(period === "custom" ? { ...(range.from ? { from: range.from } : {}), ...(range.to ? { to: range.to } : {}) } : {}),
    });
  };

  return (
    <FilterCard
      fieldCount={period === "custom" ? 4 : 3}
      actionsInGrid
      onSubmit={submit}
      onClear={() => {
        // Xóa lọc = về trạng thái mặc định (7 ngày gần nhất), giữ bộ lọc theo đơn nếu đang xem một đơn.
        setPeriod(DEFAULT_REFUND_PERIOD);
        setRange({});
        setQ("");
        setSubMerchantId("");
        onSearch(initial.orderId ? { orderId: initial.orderId } : {});
      }}
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Khoảng thời gian</span>
        <SegmentedControl options={REFUND_PERIOD_OPTIONS} value={period} onChange={setPeriod} ariaLabel="Khoảng thời gian" />
      </div>
      {period === "custom" ? (
        <DatePicker
          mode="range"
          label="Ngày tạo"
          placeholder="Từ ngày, đến ngày"
          value={range.from || range.to ? { from: toDate(range.from), to: toDate(range.to) } : undefined}
          onChange={(value) => {
            const next = value && !(value instanceof Date) ? (value as DateRange) : undefined;
            setRange({ from: toIso(next?.from), to: toIso(next?.to) });
          }}
        />
      ) : null}
      <Input
        label="Mã hoàn tiền / mã giao dịch / mã đơn hàng"
        placeholder="Nhập một mã để tìm"
        value={q}
        onChange={(event) => setQ(event.target.value)}
      />
      <SubMerchantFilterField value={subMerchantId} onChange={setSubMerchantId} />
    </FilterCard>
  );
}
