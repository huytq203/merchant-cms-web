"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { currentAccountLabel, type SubAccountMap } from "../utils/bank-assignment";

type Props = {
  value: readonly string[];
  onChange: (ids: string[]) => void;
  /** Sub → TK nó đang dùng (không gồm TK đang sửa), để ghi "đang dùng TK X" cạnh từng Sub. */
  currentAccounts: SubAccountMap;
  /** Sub đã gán TK này trước khi mở form. */
  originalIds: readonly string[];
  /** TK đang Khóa: BE không nhận Sub mới (5738), chỉ cho gỡ Sub. */
  locked: boolean;
};

/**
 * Hợp đồng v2: Sub đang dùng TK khác được BE chuyển NGAY sang TK này khi lưu (mỗi Sub đúng 1 TK). Mỗi Sub ghi rõ TK
 * đang dùng; form xin xác nhận trước khi gửi (xem `BankMoveConfirm`).
 */
export const MOVE_SUB_WARNING = "Sub-merchant đang dùng tài khoản khác sẽ chuyển sang tài khoản này ngay khi lưu.";
export const LOCKED_ACCOUNT_HINT = "Tài khoản đang bị khóa nên không gán thêm Sub-merchant được, chỉ có thể gỡ Sub-merchant.";

/**
 * Chọn các Sub dùng TK (thay ô "Áp dụng cho" Master/Sub cũ). Danh sách Sub lấy từ `/sub-merchants/choices`, cùng truy
 * vấn với các ô lọc Sub. Thứ tự gửi theo thứ tự Sub trong danh sách để request ổn định.
 */
export function BankAccountSubsField({ value, onChange, currentAccounts, originalIds, locked }: Props) {
  const labelId = useId();
  const subMerchants = useSubMerchantOptions();
  const options = subMerchants.data ?? [];
  // Sub đang gán nhưng không còn trong danh sách lựa chọn vẫn được giữ, để lưu form không vô tình gỡ nó.
  const unknown = value.filter((id) => !options.some((option) => option.id === id));

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(value);
    if (checked) next.add(id);
    else next.delete(id);
    onChange([...options.map((option) => option.id).filter((optionId) => next.has(optionId)), ...unknown.filter((item) => next.has(item))]);
  };

  return (
    <div role="group" aria-labelledby={labelId} className="space-y-1.5">
      <span id={labelId} className="text-sm font-medium text-foreground">Sub-merchant sử dụng tài khoản</span>
      {subMerchants.isPending ? (
        <p className="text-sm text-muted-foreground">Đang tải danh sách Sub-merchant...</p>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có Sub-merchant để gán.</p>
      ) : (
        <ul className="max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-border p-2">
          {options.map((option) => {
            const checked = value.includes(option.id);
            const other = currentAccounts.get(option.id);
            // TK Khóa: Sub chưa gán thì không tick thêm được; Sub đang gán vẫn bỏ tick được.
            const disabled = locked && !checked && !originalIds.includes(option.id);
            return (
              <li key={option.id} className="flex flex-wrap items-center gap-x-2 rounded px-1 py-1 hover:bg-muted">
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(next) => toggle(option.id, next === true)}
                  label={`${option.code} - ${option.name}`}
                />
                {other ? (
                  <span className="text-xs text-muted-foreground">đang dùng {currentAccountLabel(other)}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        {locked ? LOCKED_ACCOUNT_HINT : `Có thể để trống và gán sau. ${MOVE_SUB_WARNING}`}
      </p>
    </div>
  );
}
