"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet/Sheet";
import { cn } from "@/lib/utils/cn";
import { vnToday } from "@/lib/utils/vn-time";
import { downloadMovementsCsv } from "../movement-queries";
import type { MovementPocket, MovementTypeFilter } from "../movement-types";
import { exportRangeError, formatBalance, MOVEMENT_TYPE_LABELS } from "../utils/movement-format";
import { movementRangeToDates, type MovementRange } from "../utils/movement-range";
import { MovementDetail } from "./MovementDetail";
import { MovementList } from "./MovementList";

interface Props {
  subMerchantId: string;
  subCode?: string | null;
  subName?: string | null;
  availableBalance: number;
  /** Which source the popup opens on. Absent = "Tất cả" as before; the "Số dư thu-chi hộ khác" row opens it on OTHER (CẦN CHỐT 13 GĐ7). */
  initialPocket?: MovementPocket;
  /** Text of the button that opens the popup. */
  triggerLabel?: string;
  /** Whether the user holds EXPORT_BALANCE; the BE checks it again, so hiding the button is only a courtesy. */
  canExport?: boolean;
  /** Displayed balance of each source (the thu-chi hộ khác one is net of the Trả sau debt and may be negative); absent = not known. */
  pocketBalances?: Partial<Record<MovementPocket, number | null>>;
}

const TYPE_CHIPS: { value: MovementTypeFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "ORDER", label: "Đơn hàng" },
  { value: "WITHDRAWAL", label: "Lệnh rút" },
  { value: "REFUND", label: "Hoàn tiền" },
  { value: "FREEZE", label: "Đóng băng" },
];

/** Chi hộ and nạp rows only exist at the thu-chi hộ khác pocket, so their chips are offered only there. */
const OTHER_POCKET_CHIPS: { value: MovementTypeFilter; label: string }[] = [
  { value: "DISBURSEMENT", label: MOVEMENT_TYPE_LABELS.DISBURSEMENT },
  { value: "TOPUP", label: MOVEMENT_TYPE_LABELS.TOPUP },
];

/** "ALL" is not sent to the BE: no `pocket` means every source with no Trả sau debt, exactly the popup before GĐ7. */
type PocketChoice = MovementPocket | "ALL";
const POCKET_CHIPS: { value: PocketChoice; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "WALLET", label: "Thu hộ ví" },
  { value: "OTHER", label: "Thu-chi hộ khác" },
];

const POCKET_TITLES: Record<PocketChoice, string> = {
  ALL: "Biến động số dư khả dụng",
  WALLET: "Biến động số dư thu hộ ví",
  OTHER: "Biến động số dư thu-chi hộ khác",
};
const POCKET_BALANCE_LABELS: Record<MovementPocket, string> = { WALLET: "Số dư thu hộ ví", OTHER: "Số dư thu-chi hộ khác" };

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
export function SubBalanceMovementsDialog({
  subMerchantId, subCode, subName, availableBalance, initialPocket, triggerLabel = "Xem biến động số dư", canExport = false, pocketBalances,
}: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ name: "list" });
  const [pocketChoice, setPocketChoice] = useState<PocketChoice>(initialPocket ?? "ALL");
  const [type, setType] = useState<MovementTypeFilter>("ALL");
  const [exporting, setExporting] = useState(false);
  // The failure is remembered with the filter it belongs to, so it disappears as soon as the user changes the filter.
  const [exportFailure, setExportFailure] = useState<{ key: string; message: string } | null>(null);
  const [range, setRange] = useState<MovementRange>("7d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const bodyRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);

  const { fromDate, toDate } = movementRangeToDates(range, vnToday(), custom);
  const pocket = pocketChoice === "ALL" ? undefined : pocketChoice;
  // The balance in the subtitle follows the chosen source; for a source whose balance the page does not know it is left out
  // rather than showing the total of another scope.
  const pocketBalance = pocket ? pocketBalances?.[pocket] : availableBalance;
  const balanceText = pocket
    ? (pocketBalance == null ? null : `${POCKET_BALANCE_LABELS[pocket]} hiện tại ${formatBalance(pocketBalance)}`)
    : `Số dư khả dụng hiện tại ${formatBalance(availableBalance)}`;
  const subtitle = [subCode, subName, balanceText].filter(Boolean).join(" · ");
  const typeChips = pocket === "OTHER" ? [...TYPE_CHIPS, ...OTHER_POCKET_CHIPS] : TYPE_CHIPS;
  const filterKey = [pocketChoice, type, fromDate, toDate].join("|");

  const choosePocket = (next: PocketChoice) => {
    setPocketChoice(next);
    // A chi hộ/nạp chip does not exist outside the thu-chi hộ khác pocket: do not leave it selected and invisible.
    if (next !== "OTHER" && (type === "DISBURSEMENT" || type === "TOPUP")) setType("ALL");
  };

  const exportCsv = async () => {
    // The same range rule as the BE (both dates, at most 93 days) so a wrong range never leaves the browser.
    const rangeError = exportRangeError(fromDate, toDate);
    if (rangeError) {
      setExportFailure({ key: filterKey, message: rangeError });
      return;
    }
    setExportFailure(null);
    setExporting(true);
    try {
      await downloadMovementsCsv(subMerchantId, { type, pocket, fromDate, toDate });
    } catch (error) {
      // The BE sentence (6334 too many rows, 93 days, ledger unreachable) is already Vietnamese: show it as it is.
      setExportFailure({ key: filterKey, message: error instanceof Error ? error.message : "Không xuất được file, vui lòng thử lại" });
    } finally {
      setExporting(false);
    }
  };
  const exportMessage = exportFailure?.key === filterKey ? exportFailure.message : null;

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
      {/* A button that opens on a source names it, so two "Xem biến động" buttons on one page stay distinguishable. */}
      <Button
        variant={initialPocket ? "ghost" : "outline"}
        size={initialPocket ? "sm" : undefined}
        aria-label={initialPocket ? `${triggerLabel} ${POCKET_TITLES[initialPocket].replace("Biến động số dư ", "")}` : undefined}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
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
              <SheetTitle>{POCKET_TITLES[pocketChoice]}</SheetTitle>
            )}
            <SheetDescription className="break-words">{subtitle}</SheetDescription>
          </SheetHeader>
          <SheetBody ref={bodyRef}>
            <div hidden={view.name === "detail"}>
              <div className="mb-3 grid gap-3">
                <ChipGroup label="Nguồn số dư" chips={POCKET_CHIPS} value={pocketChoice} onChange={choosePocket} />
                <ChipGroup label="Loại biến động" chips={typeChips} value={type} onChange={setType} />
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
                {canExport ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" aria-hidden="true" />} isLoading={exporting} onClick={() => void exportCsv()}>
                      Xuất CSV
                    </Button>
                    {exportMessage ? <p role="alert" className="min-w-0 break-words text-sm text-danger">{exportMessage}</p> : null}
                  </div>
                ) : null}
              </div>
              <MovementList subMerchantId={subMerchantId} filter={{ type, pocket, fromDate, toDate }} onSelect={(movement) => openDetail(movement.id, movement.label)} />
            </div>
            {view.name === "detail" ? <MovementDetail subMerchantId={subMerchantId} operationId={view.id} pocket={pocket} /> : null}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
