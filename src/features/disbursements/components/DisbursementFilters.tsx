"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { X } from "lucide-react";
import { FilterCard } from "@/components/page/FilterCard";
import { Notice } from "@/components/page/Notice";
import { Button } from "@/components/ui/button/Button";
import { DatePicker } from "@/components/ui/datepicker/DatePicker";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { SubMerchantMultiFilter } from "@/features/sub-merchants/components/SubMerchantMultiFilter";
import { DISBURSEMENT_BANK_OPTIONS } from "../constants/disbursement-banks";
import { MAX_CODE_LENGTH, orderChannelSchema, orderFilterFormSchema, orderStatusSchema } from "../schemas/disbursement-filter.schema";
import type { OrderFilterValues } from "../types/types";
import { parseAmountInput } from "../utils/disbursement-mapper";
import { DISBURSEMENT_CHANNEL_OPTIONS, DISBURSEMENT_STATUS_OPTIONS } from "../utils/disbursement-status";

type Props = { initial: OrderFilterValues; onSearch: (values: OrderFilterValues) => void };

const toDay = (value: Date | undefined) => (value ? format(value, "yyyy-MM-dd") : "");
const toRange = (from: string, to: string): DateRange | undefined => (from ? { from: parseISO(from), to: to ? parseISO(to) : undefined } : undefined);
const asRange = (value: unknown): DateRange | undefined => (value && !(value instanceof Date) ? (value as DateRange) : undefined);

/** Số tiền ô lọc: để trống = không lọc; chữ lạ hay số thập phân = NaN để schema báo lỗi chứ không đoán ý người dùng. */
const amountOf = (text: string): number | undefined => (text.trim() === "" ? undefined : parseAmountInput(text.trim()));

/**
 * Bộ lọc danh sách lệnh chi hộ: mã lệnh / mã YC / mã Ref, Sub (nhiều, chỉ các Sub trong phạm vi của người dùng), hình
 * thức, trạng thái, ngân hàng nhận, khoảng tiền, thời gian tạo và thành công. Lọc theo lô (đi từ trang lô sang) được giữ
 * lại và có nút bỏ. Sai khoảng thì báo ngay, không gọi BE.
 */
export function DisbursementFilters({ initial, onSearch }: Props) {
  const [code, setCode] = useState(initial.code ?? "");
  const [subMerchantIds, setSubMerchantIds] = useState<string[]>(initial.subMerchantIds ?? []);
  const [channel, setChannel] = useState<string>(initial.channel ?? "");
  const [status, setStatus] = useState<string>(initial.status ?? "");
  const [bankCode, setBankCode] = useState(initial.bankCode ?? "");
  const [amountFrom, setAmountFrom] = useState(initial.amountFrom === undefined ? "" : String(initial.amountFrom));
  const [amountTo, setAmountTo] = useState(initial.amountTo === undefined ? "" : String(initial.amountTo));
  const [createdFrom, setCreatedFrom] = useState(initial.createdFrom ?? "");
  const [createdTo, setCreatedTo] = useState(initial.createdTo ?? "");
  const [succeededFrom, setSucceededFrom] = useState(initial.succeededFrom ?? "");
  const [succeededTo, setSucceededTo] = useState(initial.succeededTo ?? "");
  const [batchId, setBatchId] = useState(initial.batchId ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (batchOverride?: string) => {
    const batch = batchOverride ?? batchId;
    const parsedChannel = orderChannelSchema.safeParse(channel);
    const parsedStatus = orderStatusSchema.safeParse(status);
    const from = amountOf(amountFrom);
    const to = amountOf(amountTo);
    const checked = orderFilterFormSchema.safeParse({
      ...(code.trim() ? { code: code.trim() } : {}),
      ...(subMerchantIds.length > 0 ? { subMerchantIds } : {}),
      ...(parsedChannel.success ? { channel: parsedChannel.data } : {}),
      ...(parsedStatus.success ? { status: parsedStatus.data } : {}),
      ...(bankCode ? { bankCode } : {}),
      ...(from !== undefined ? { amountFrom: from } : {}),
      ...(to !== undefined ? { amountTo: to } : {}),
      ...(createdFrom ? { createdFrom } : {}),
      ...(createdTo ? { createdTo } : {}),
      ...(succeededFrom ? { succeededFrom } : {}),
      ...(succeededTo ? { succeededTo } : {}),
      ...(batch ? { batchId: batch } : {}),
    });
    if (!checked.success) {
      setError(checked.error.issues[0]?.message ?? "Bộ lọc không hợp lệ");
      return;
    }
    setError(null);
    onSearch(checked.data);
  };

  const clear = () => {
    setCode("");
    setSubMerchantIds([]);
    setChannel("");
    setStatus("");
    setBankCode("");
    setAmountFrom("");
    setAmountTo("");
    setCreatedFrom("");
    setCreatedTo("");
    setSucceededFrom("");
    setSucceededTo("");
    setBatchId("");
    setError(null);
    onSearch({});
  };

  return (
    <div className="space-y-3">
      <FilterCard fieldCount={9} onSubmit={() => submit()} onClear={clear}>
        <Input
          label="Mã lệnh / mã yêu cầu / mã Ref"
          placeholder="Nhập mã cần tìm (khớp đúng)"
          value={code}
          maxLength={MAX_CODE_LENGTH}
          onChange={(event) => setCode(event.target.value)}
        />
        <SubMerchantMultiFilter value={subMerchantIds} onChange={setSubMerchantIds} />
        <Select label="Hình thức" value={channel} onChange={setChannel} options={DISBURSEMENT_CHANNEL_OPTIONS} placeholder="Tất cả hình thức" />
        <Select label="Trạng thái" value={status} onChange={setStatus} options={DISBURSEMENT_STATUS_OPTIONS} placeholder="Tất cả trạng thái" />
        <Select
          label="Ngân hàng nhận"
          value={bankCode}
          onChange={setBankCode}
          options={DISBURSEMENT_BANK_OPTIONS.map(({ value, label }) => ({ value, label }))}
          placeholder="Tất cả ngân hàng"
        />
        <Input label="Số tiền từ" inputMode="numeric" placeholder="VND" value={amountFrom} onChange={(event) => setAmountFrom(event.target.value)} />
        <Input label="Số tiền đến" inputMode="numeric" placeholder="VND" value={amountTo} onChange={(event) => setAmountTo(event.target.value)} />
        <DatePicker
          mode="range"
          label="Ngày tạo"
          value={toRange(createdFrom, createdTo)}
          onChange={(value) => {
            const range = asRange(value);
            setCreatedFrom(toDay(range?.from));
            setCreatedTo(toDay(range?.to));
          }}
          placeholder="Từ ngày, đến ngày"
        />
        <DatePicker
          mode="range"
          label="Ngày thành công"
          value={toRange(succeededFrom, succeededTo)}
          onChange={(value) => {
            const range = asRange(value);
            setSucceededFrom(toDay(range?.from));
            setSucceededTo(toDay(range?.to));
          }}
          placeholder="Từ ngày, đến ngày"
        />
      </FilterCard>
      {batchId ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Đang xem các lệnh của một lô chi hộ.</span>
          <Button type="button" variant="outline" size="sm" leftIcon={<X size={14} aria-hidden />} onClick={() => {
              // Bỏ lọc theo lô là đổi kết quả đang xem nên tìm lại ngay, giữ nguyên các bộ lọc khác.
              setBatchId("");
              submit("");
            }}>
            Bỏ lọc theo lô
          </Button>
        </div>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}
