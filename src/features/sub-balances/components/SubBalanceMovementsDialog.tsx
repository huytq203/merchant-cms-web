"use client";

import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet/Sheet";
import { cn } from "@/lib/utils/cn";
import { formatAmount } from "@/lib/utils/helper";
import { vnToday } from "@/lib/utils/vn-time";
import type { MovementTypeFilter } from "../movement-types";
import { movementRangeToDates, type MovementRange } from "../utils/movement-range";
import { MovementDetail } from "./MovementDetail";
import { MovementList } from "./MovementList";

interface Props {
  subMerchantId: string;
  subCode?: string | null;
  subName?: string | null;
  availableBalance: number;
}

const TYPE_CHIPS: { value: MovementTypeFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "ORDER", label: "Đơn hàng" },
  { value: "WITHDRAWAL", label: "Lệnh rút" },
  { value: "REFUND", label: "Hoàn tiền" },
  { value: "FREEZE", label: "Đóng băng" },
];

/** 7 ngày is the default of every Portal screen with figures per day; 90 ngày is the longest preset. */
const RANGE_CHIPS: { value: MovementRange; label: string }[] = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "90 ngày" },
  { value: "custom", label: "Tùy chỉnh" },
];

/** One single-choice row of chips (type or period), keyboard-focusable and announced as a radio group. */
function ChipGroup<T extends string>({ label, chips, value, onChange }: {
  label: string;
  chips: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          role="radio"
          aria-checked={value === chip.value}
          onClick={() => onChange(chip.value)}
          className={cn(
            "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === chip.value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

type View = { name: "list" } | { name: "detail"; id: string; label: string };

/**
 * "Xem biến động số dư": a full-height drawer (more rows fit than in a dialog, 10/11/2026) listing the credits and debits of the Sub's available balance, and the breakdown of
 * one of them. Filters live here (not in the list) so they survive the trip to a detail and back; the list stays
 * mounted but hidden while a detail is open, which keeps its pages, and the body's scroll position is restored on return.
 * Nothing is fetched until the dialog opens, because the content mounts only while open.
 */
export function SubBalanceMovementsDialog({ subMerchantId, subCode, subName, availableBalance }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ name: "list" });
  const [type, setType] = useState<MovementTypeFilter>("ALL");
  const [range, setRange] = useState<MovementRange>("7d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const bodyRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);

  const { fromDate, toDate } = movementRangeToDates(range, vnToday(), custom);
  const subtitle = [subCode, subName, `Số dư khả dụng hiện tại ${formatAmount(availableBalance)}`].filter(Boolean).join(" · ");

  const openDetail = (id: string, label: string) => {
    savedScroll.current = bodyRef.current?.scrollTop ?? 0;
    setView({ name: "detail", id, label });
  };
  const backToList = () => {
    setView({ name: "list" });
    // The hidden list needs a frame to be laid out again before its old scroll position can be restored.
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = savedScroll.current;
    });
  };
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setView({ name: "list" });
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Xem biến động số dư</Button>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent size="full" className="w-full overflow-x-hidden sm:w-[640px]">
          <SheetHeader>
            {view.name === "detail" ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" aria-label="Quay lại danh sách" onClick={backToList}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <SheetTitle className="min-w-0 break-words">{view.label}</SheetTitle>
              </div>
            ) : (
              <SheetTitle>Biến động số dư khả dụng</SheetTitle>
            )}
            <SheetDescription className="break-words">{subtitle}</SheetDescription>
          </SheetHeader>
          <SheetBody ref={bodyRef}>
            <div hidden={view.name === "detail"}>
              <div className="mb-3 grid gap-3">
                <ChipGroup label="Loại biến động" chips={TYPE_CHIPS} value={type} onChange={setType} />
                <ChipGroup label="Khoảng thời gian" chips={RANGE_CHIPS} value={range} onChange={setRange} />
                {range === "custom" ? (
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="w-40 max-w-full">
                      <Input type="date" label="Từ ngày" value={custom.from} max={custom.to || undefined} onChange={(event) => setCustom((prev) => ({ ...prev, from: event.target.value }))} />
                    </div>
                    <div className="w-40 max-w-full">
                      <Input type="date" label="Đến ngày" value={custom.to} min={custom.from || undefined} onChange={(event) => setCustom((prev) => ({ ...prev, to: event.target.value }))} />
                    </div>
                  </div>
                ) : null}
              </div>
              <MovementList subMerchantId={subMerchantId} filter={{ type, fromDate, toDate }} onSelect={(movement) => openDetail(movement.id, movement.label)} />
            </div>
            {view.name === "detail" ? <MovementDetail subMerchantId={subMerchantId} operationId={view.id} /> : null}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
