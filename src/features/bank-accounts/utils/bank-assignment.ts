import type { BankAccount } from "../types";
import { bankAccountTitle } from "./bank-mapper";

/**
 * Gán Sub cho TK (SRS v2, 18/11/2026): mỗi Sub đúng 1 TK, nên chọn một Sub đang dùng TK khác nghĩa là BE CHUYỂN Sub đó
 * sang TK này ngay khi lưu. Portal không có API `assignable-sub-merchants` như Admin, nên dựng bảng Sub → TK hiện tại từ
 * chính danh sách TK của Master (người được thêm/sửa TK có quyền toàn Master nên thấy đủ Sub đang dùng mỗi TK).
 */
export type SubAccountMap = ReadonlyMap<string, BankAccount>;

/** Sub → TK đang dùng; bỏ TK đang sửa vì Sub của chính nó không phải "đang dùng TK khác". */
export function subAccountMap(accounts: readonly BankAccount[], editingAccountId?: string): SubAccountMap {
  const map = new Map<string, BankAccount>();
  for (const account of accounts) {
    if (account.id === editingAccountId) continue;
    for (const sub of account.assignedSubMerchants) map.set(sub.id, account);
  }
  return map;
}

/** Sub vừa chọn thêm (chưa gán TK này trước đó) đang dùng TK khác: các Sub sẽ bị chuyển khi lưu. */
export function movingSubIds(selected: readonly string[], map: SubAccountMap, alreadyAssigned: readonly string[]): string[] {
  return selected.filter((id) => !alreadyAssigned.includes(id) && map.has(id));
}

/** Nhãn ngắn TK hiện tại của một Sub, ví dụ "Vietcombank ****1234 (Khóa)". */
export const currentAccountLabel = (account: BankAccount): string =>
  `${bankAccountTitle(account)}${account.accountStatus === "LOCKED" ? " (Khóa)" : ""}`;
