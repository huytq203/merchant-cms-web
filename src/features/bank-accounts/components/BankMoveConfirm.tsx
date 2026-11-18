"use client";

import { Notice } from "@/components/page/Notice";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { currentAccountLabel, type SubAccountMap } from "../utils/bank-assignment";

type Props = {
  movingIds: readonly string[];
  currentAccounts: SubAccountMap;
  /** Tên hiển thị của Sub theo id (từ danh sách lựa chọn Sub). */
  subLabel: (id: string) => string;
  confirmed: boolean;
  error?: string;
  onConfirm: (confirmed: boolean) => void;
};

export const MOVE_CONFIRM_LABEL = "Tôi xác nhận chuyển các Sub-merchant trên sang tài khoản này";
export const MOVE_CONFIRM_REQUIRED = "Vui lòng xác nhận chuyển Sub-merchant trước khi lưu";

/**
 * Hợp đồng TK NH v2: "Sub đang dùng TK khác được chuyển ngay (FE phải cảnh báo + xác nhận trước)". Liệt kê Sub sẽ bị
 * chuyển kèm TK hiện tại, bắt buộc tích xác nhận trước khi xin OTP. Lệnh rút đang xử lý của Sub vẫn chi về TK cũ.
 */
export function BankMoveConfirm({ movingIds, currentAccounts, subLabel, confirmed, error, onConfirm }: Props) {
  if (movingIds.length === 0) return null;
  return (
    <Notice tone="warning">
      <div className="space-y-2">
      <p className="font-medium">Các Sub-merchant sau đang dùng tài khoản khác và sẽ chuyển sang tài khoản này khi lưu:</p>
      <ul className="list-disc space-y-0.5 pl-5">
        {movingIds.map((id) => {
          const from = currentAccounts.get(id);
          return (
            <li key={id}>
              {subLabel(id)}
              {from ? ` (đang dùng ${currentAccountLabel(from)})` : ""}
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground">Lệnh rút đang xử lý của các Sub-merchant này vẫn chi về tài khoản cũ.</p>
      <Checkbox checked={confirmed} onCheckedChange={(next) => onConfirm(next === true)} label={MOVE_CONFIRM_LABEL} />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    </Notice>
  );
}
