"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover/Popover";
import { Select } from "@/components/ui/select/Select";
import { cn } from "@/lib/utils/cn";
import type { SubMerchantOption } from "../hooks/use-sub-merchant-options";

export interface SubMerchantMultiSelectProps {
  /** Mọi Sub người dùng được chọn; `merchantId` dùng để lọc theo Master khi có bước chọn Master. */
  options: readonly SubMerchantOption[];
  /** Id các Sub đang lọc; rỗng = "Tất cả Sub-merchant". */
  value: readonly string[];
  /** Gọi khi bấm "Áp dụng"; rỗng nghĩa là bỏ lọc theo Sub. */
  onChange: (ids: string[]) => void;
  /** Các Master của phiên; từ 2 trở lên thì thêm bước chọn Merchant và ô đổi tên "Merchant / Sub-merchant". */
  merchants?: readonly { id: string; label: string }[];
  /** Ghi đè nhãn mặc định của ô. */
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Số chip tối đa hiện trên ô đóng; phần còn lại gom thành "+N". */
const MAX_CHIPS = 2;
/** Giá trị nội bộ cho "chưa chọn Master" trong Select (Select không nhận giá trị rỗng như một lựa chọn). */
const ALL_MASTERS = "";

/** Bỏ dấu và hoa thường để tìm "thu duc" ra "Thủ Đức". */
const fold = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

const optionLabel = (option: SubMerchantOption) => `${option.code} — ${option.name}`;

/**
 * Ô lọc chọn nhiều Sub-merchant dùng chung cho các màn danh sách Portal.
 * Người dùng tick trong popup (bản nháp) rồi "Áp dụng" mới đổi giá trị; đóng popup không áp dụng thì bỏ nháp.
 * Quy tắc: không tick Sub nào hoặc tick đủ mọi Sub = "Tất cả" (không gửi `subMerchantIds` lên BE).
 */
export function SubMerchantMultiSelect({
  options,
  value,
  onChange,
  merchants = [],
  label,
  loading = false,
  disabled = false,
  className,
}: SubMerchantMultiSelectProps) {
  const labelId = useId();
  const hasMasterStep = merchants.length >= 2;
  const fieldLabel = label ?? (hasMasterStep ? "Merchant / Sub-merchant" : "Sub-merchant");

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [masterId, setMasterId] = useState(ALL_MASTERS);
  const [search, setSearch] = useState("");

  const byId = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);

  // Sub thuộc phạm vi đang xem: toàn bộ, hoặc chỉ của Master đã chọn ở bước 1.
  const scope = useMemo(
    () => (hasMasterStep && masterId ? options.filter((option) => option.merchantId === masterId) : options),
    [hasMasterStep, masterId, options],
  );
  const visible = useMemo(() => {
    const needle = fold(search.trim());
    return needle ? scope.filter((option) => fold(`${option.code} ${option.name}`).includes(needle)) : scope;
  }, [scope, search]);

  const scopeSelected = scope.filter((option) => draft.includes(option.id)).length;
  const allChecked = scope.length > 0 && scopeSelected === scope.length;
  const partial = scopeSelected > 0 && !allChecked;

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Mỗi lần mở bắt đầu từ giá trị đã áp dụng; Master khởi tạo theo Sub đầu tiên đang chọn.
      setDraft([...value]);
      setMasterId(hasMasterStep ? (byId.get(value[0] ?? "")?.merchantId ?? ALL_MASTERS) : ALL_MASTERS);
      setSearch("");
    }
    setOpen(next);
  };

  const toggle = (id: string, checked: boolean) =>
    setDraft((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));

  const toggleAll = (checked: boolean) => {
    const scopeIds = new Set(scope.map((option) => option.id));
    setDraft((current) => [...current.filter((id) => !scopeIds.has(id)), ...(checked ? scope.map((option) => option.id) : [])]);
  };

  const changeMaster = (next: string) => {
    // Tick của Master cũ không còn nghĩa khi sang Master khác nên bỏ hết.
    setMasterId(next);
    setDraft([]);
    setSearch("");
  };

  const apply = () => {
    // Tick đủ mọi Sub (không bước Master, hoặc "Tất cả Merchant") = không lọc; theo Master thì giữ danh sách vì chưa phải toàn bộ.
    const coversEverything = draft.length > 0 && options.every((option) => draft.includes(option.id)) && !(hasMasterStep && masterId);
    onChange(coversEverything ? [] : options.filter((option) => draft.includes(option.id)).map((option) => option.id));
    setOpen(false);
  };

  const chips = value.map((id) => byId.get(id)).filter((option): option is SubMerchantOption => Boolean(option));
  const placeholder = "Tất cả Sub-merchant";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span id={labelId} className="text-sm font-medium text-foreground">
        {fieldLabel}
      </span>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          disabled={disabled}
          aria-labelledby={labelId}
          className="group flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            {chips.length === 0 ? (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {chips.slice(0, MAX_CHIPS).map((option) => (
                  <span key={option.id} className="max-w-[45%] truncate rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                    {optionLabel(option)}
                  </span>
                ))}
                {chips.length > MAX_CHIPS ? (
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">+{chips.length - MAX_CHIPS}</span>
                ) : null}
              </>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 group-data-popup-open:rotate-180" aria-hidden />
        </PopoverTrigger>
        <PopoverContent role="dialog" aria-label={fieldLabel} align="start" showArrow={false} className="w-[min(22rem,calc(100vw-2rem))] p-3">
          <div className="flex flex-col gap-3">
            {hasMasterStep ? (
              <Select
                label="Merchant"
                value={masterId}
                onChange={changeMaster}
                clearable={false}
                placeholder="Tất cả Merchant"
                options={[{ label: "Tất cả Merchant", value: ALL_MASTERS }, ...merchants.map((merchant) => ({ label: merchant.label, value: merchant.id }))]}
              />
            ) : null}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                aria-label="Tìm Sub-merchant"
                placeholder="Tìm theo tên hoặc mã Sub"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-2 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {loading ? (
              <p className="py-3 text-center text-sm text-muted-foreground">Đang tải danh sách Sub-merchant…</p>
            ) : scope.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">Không có Sub-merchant nào để chọn.</p>
            ) : (
              <>
                <div className="border-b border-border pb-2">
                  <Checkbox
                    size="md"
                    checked={allChecked}
                    indeterminate={partial}
                    onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                    label={`Tất cả Sub-merchant (${scope.length})`}
                  />
                </div>
                <ul className="flex max-h-56 flex-col gap-0.5 overflow-y-auto" aria-label="Danh sách Sub-merchant">
                  {visible.map((option) => (
                    <li key={option.id} className="rounded px-1 py-1 hover:bg-muted">
                      <Checkbox
                        checked={draft.includes(option.id)}
                        onCheckedChange={(checked) => toggle(option.id, Boolean(checked))}
                        label={
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate">{option.name}</span>
                            <span className="text-xs font-normal text-muted-foreground">{option.code}</span>
                          </span>
                        }
                      />
                    </li>
                  ))}
                  {visible.length === 0 ? <li className="py-3 text-center text-sm text-muted-foreground">Không tìm thấy Sub phù hợp.</li> : null}
                </ul>
              </>
            )}
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setDraft([])}>
                Bỏ chọn
              </Button>
              <Button type="button" size="sm" onClick={apply}>
                Áp dụng
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
