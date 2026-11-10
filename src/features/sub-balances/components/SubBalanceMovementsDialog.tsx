"use client";

import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
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
  { value: "ESCROW", label: "Ký quỹ" },
];

const RANGE_OPTIONS: { value: MovementRange; label: string }[] = [
  { value: "7d", label: "7 ngày gần nhất" },
  { value: "30d", label: "30 ngày" },
  { value: "custom", label: "Tùy chọn" },
];

type View = { name: "list" } | { name: "detail"; id: string; label: string };

/**
 * "Xem biến động số dư": a dialog listing the credits and debits of the Sub's available balance, and the breakdown of
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100vw-2rem)] overflow-x-hidden sm:max-w-xl">
          <DialogHeader className="pr-6">
            {view.name === "detail" ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" aria-label="Quay lại danh sách" onClick={backToList}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <DialogTitle className="min-w-0 break-words">{view.label}</DialogTitle>
              </div>
            ) : (
              <DialogTitle>Biến động số dư khả dụng</DialogTitle>
            )}
            <DialogDescription className="break-words">{subtitle}</DialogDescription>
          </DialogHeader>
          <DialogBody ref={bodyRef}>
            <div hidden={view.name === "detail"}>
              <div className="mb-3 grid gap-3">
                <div role="radiogroup" aria-label="Loại biến động" className="flex flex-wrap gap-2">
                  {TYPE_CHIPS.map((chip) => (
                    <button
                      key={chip.value}
                      type="button"
                      role="radio"
                      aria-checked={type === chip.value}
                      onClick={() => setType(chip.value)}
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        type === chip.value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="w-48 max-w-full">
                    <Select
                      label="Khoảng thời gian"
                      options={RANGE_OPTIONS}
                      value={range}
                      clearable={false}
                      onChange={(value) => setRange(value === "30d" || value === "custom" ? value : "7d")}
                    />
                  </div>
                  {range === "custom" ? (
                    <>
                      <div className="w-40 max-w-full">
                        <Input type="date" label="Từ ngày" value={custom.from} max={custom.to || undefined} onChange={(event) => setCustom((prev) => ({ ...prev, from: event.target.value }))} />
                      </div>
                      <div className="w-40 max-w-full">
                        <Input type="date" label="Đến ngày" value={custom.to} min={custom.from || undefined} onChange={(event) => setCustom((prev) => ({ ...prev, to: event.target.value }))} />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              <MovementList subMerchantId={subMerchantId} filter={{ type, fromDate, toDate }} onSelect={(movement) => openDetail(movement.id, movement.label)} />
            </div>
            {view.name === "detail" ? <MovementDetail subMerchantId={subMerchantId} operationId={view.id} /> : null}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
