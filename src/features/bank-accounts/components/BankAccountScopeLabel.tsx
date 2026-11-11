"use client";

import { useSubMerchantOptions, type SubMerchantOption } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import type { BankAccount } from "../types";

/** Phạm vi nhận quyết toán của TK cấp Master (cùng câu với ô "Áp dụng cho" ở form thêm TK). */
export const MASTER_SCOPE_HINT = "Mọi Sub-merchant chưa có tài khoản riêng nhận quyết toán về tài khoản này";

/**
 * Nhãn "Áp dụng cho" (11/11/2026): TK không gắn Sub là cấp Master; TK gắn Sub hiện "mã - tên" Sub. Tên lấy từ danh
 * sách Sub nhẹ (`/sub-merchants/choices`, cùng truy vấn với các ô chọn Sub nên không gọi thêm API). Sub không tra được
 * (danh sách chưa tải, hoặc Sub ngoài danh sách) vẫn ghi "Sub-merchant" để ô không trống và không lộ id.
 */
export function bankScopeLabel(
  account: Pick<BankAccount, "subMerchantId" | "level">,
  subMerchants: SubMerchantOption[] | undefined,
): string {
  if (!account.subMerchantId) return "Cấp Master";
  const sub = subMerchants?.find((item) => item.id === account.subMerchantId);
  return sub ? `${sub.code} - ${sub.name}` : "Sub-merchant";
}

/** Ô "Áp dụng cho" dùng ở bảng và màn chi tiết TK. */
export function BankAccountScopeLabel({ account }: { account: Pick<BankAccount, "subMerchantId" | "level"> }) {
  const subMerchants = useSubMerchantOptions();
  const label = bankScopeLabel(account, subMerchants.data);
  return account.subMerchantId
    ? <span>{label}</span>
    : <span title={MASTER_SCOPE_HINT}>{label}</span>;
}
