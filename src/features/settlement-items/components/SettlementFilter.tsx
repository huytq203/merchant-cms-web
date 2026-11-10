"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { FilterCard } from "@/components/page/FilterCard";
import { ComboBox } from "@/components/ui/combobox/ComboBox";
import { DatePicker } from "@/components/ui/datepicker/DatePicker";
import { Select } from "@/components/ui/select/Select";
import type { SubMerchantChoice } from "@/features/sub-merchants/utils/sub-merchant-choice";
import { terminalQueries } from "@/features/terminals/terminal-queries";
import { TRANCHE_GROUPS } from "../constants/settlement-labels";
import type { SettlementCriteria } from "../hooks/use-settlement-navigation";
import type { TrancheGroup } from "../types";

interface Props {
  initial: SettlementCriteria;
  choices: SubMerchantChoice[];
  /** Phiên có quyền đọc Terminal; không có thì không hiện ô Terminal. */
  canFilterTerminal: boolean;
  onSearch: (criteria: SettlementCriteria) => void;
  onClear: () => void;
}

/** Giá trị của lựa chọn "Tất cả" trong các ô chọn; không bao giờ gửi đi. */
const ALL = "__all__";
const toDay = (value: Date | undefined) => (value ? format(value, "yyyy-MM-dd") : "");
const orUndefined = (value: string) => (value && value !== ALL ? value : undefined);

/** Số Terminal tối đa một lần tải (trần pageSize của route Terminal). */
export const TERMINAL_CHOICE_LIMIT = 100;

/**
 * Terminal của Sub đang chọn (hoặc mọi Sub trong phạm vi); chỉ tải khi phiên được đọc Terminal. Tải tối đa
 * {@link TERMINAL_CHOICE_LIMIT} và tìm trong số đó ở client: ComboBox dùng chung chưa phát sự kiện khi gõ nên chưa tìm
 * phía server theo `name` được; vượt trần thì ô hiện ghi chú để người dùng chọn Sub cho hẹp lại.
 */
function useTerminalChoices(subMerchantId: string | undefined, enabled: boolean) {
  return useQuery({
    ...terminalQueries.list({ page: 1, pageSize: TERMINAL_CHOICE_LIMIT, ...(subMerchantId ? { subMerchantId } : {}) }),
    enabled,
    select: (data) => ({
      options: data.rows.map(({ id, tid, name }) => ({ value: id, label: `${tid} — ${name}` })),
      truncated: data.total > data.rows.length,
    }),
  });
}

/**
 * Mục 11: mặc định "Tất cả sub-merchant"; thêm Terminal và Trạng thái đợt. Chỉ khoảng ngày là bắt buộc nên nút Tìm kiếm
 * chỉ chờ đủ hai ngày.
 */
export function SettlementFilter({ initial, choices, canFilterTerminal, onSearch, onClear }: Props) {
  const [subMerchantId, setSubMerchantId] = useState(initial.subMerchantId ?? ALL);
  const [terminalId, setTerminalId] = useState(initial.terminalId ?? ALL);
  const [trancheStatus, setTrancheStatus] = useState<string>(initial.trancheStatus ?? ALL);
  const [paidFrom, setPaidFrom] = useState(initial.paidFrom);
  const [paidTo, setPaidTo] = useState(initial.paidTo);
  const terminals = useTerminalChoices(orUndefined(subMerchantId), canFilterTerminal);

  const submit = () => {
    if (!paidFrom || !paidTo) return;
    onSearch({
      subMerchantId: orUndefined(subMerchantId),
      terminalId: orUndefined(terminalId),
      trancheStatus: orUndefined(trancheStatus) as TrancheGroup | undefined,
      paidFrom,
      paidTo,
    });
  };

  return (
    <FilterCard fieldCount={canFilterTerminal ? 4 : 3} onSubmit={submit} onClear={onClear}>
      <Select
        label="Sub-merchant"
        placeholder="Tất cả sub-merchant"
        options={[{ label: "Tất cả sub-merchant", value: ALL }, ...choices.map((choice) => ({ label: choice.label, value: choice.id }))]}
        value={subMerchantId}
        onChange={(value) => {
          setSubMerchantId(value || ALL);
          // Terminal đã chọn có thể không thuộc Sub mới.
          setTerminalId(ALL);
        }}
        clearable={false}
      />
      {canFilterTerminal ? (
        <div className="space-y-1">
          <ComboBox
            autocomplete
            label="Terminal"
            placeholder="Tất cả"
            emptyText="Không có Terminal phù hợp"
            options={terminals.data?.options ?? []}
            isLoading={terminals.isFetching}
            value={terminalId === ALL ? "" : terminalId}
            onValueChange={(next) => setTerminalId((typeof next === "string" ? next : next[0]) || ALL)}
          />
          {terminals.data?.truncated ? (
            <p className="text-xs text-muted-foreground">Chỉ hiện {TERMINAL_CHOICE_LIMIT} Terminal đầu; chọn Sub-merchant để thu hẹp.</p>
          ) : null}
        </div>
      ) : null}
      <Select
        label="Trạng thái đợt"
        placeholder="Tất cả"
        options={[{ label: "Tất cả", value: ALL }, ...TRANCHE_GROUPS.map((group) => ({ label: group.label, value: group.value }))]}
        value={trancheStatus}
        onChange={(value) => setTrancheStatus(value || ALL)}
        clearable={false}
      />
      <DatePicker
        mode="range"
        label="Ngày thanh toán"
        placeholder="Từ ngày, đến ngày"
        value={paidFrom ? { from: parseISO(paidFrom), to: paidTo ? parseISO(paidTo) : undefined } : undefined}
        onChange={(value) => {
          const range = value && !(value instanceof Date) ? (value as DateRange) : undefined;
          setPaidFrom(toDay(range?.from));
          setPaidTo(toDay(range?.to));
        }}
      />
    </FilterCard>
  );
}
