import type { NameInquiry } from "../types/types";

/**
 * Lưu lệnh chi hộ "chưa xác nhận" (503 6323/5xx/timeout lúc gửi) để khôi phục sau khi tải lại trang, đổi hình thức
 * Đơn lẻ/Theo lô hay đổi Sub rồi quay lại. Lý do: lệnh CÓ THỂ đã được lưu và sẽ chi; nếu khoá chỉ nằm trong bộ nhớ
 * thì người dùng F5 rồi nhập lại với mã yêu cầu mới sẽ tạo lệnh thứ hai (chi hai lần).
 *
 * Chỉ lưu mã yêu cầu + nội dung lệnh + kết quả tra tên. KHÔNG lưu OTP hay session OTP (dùng một lần, nhạy cảm).
 * localStorage có thể ném lỗi (chế độ riêng tư, đầy, bị chặn): mọi hàm nuốt lỗi, khoá vẫn giữ trong bộ nhớ.
 */
export type StoredOrderFields = {
  merchantRequestCode: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: string;
  description: string;
};

export type StoredUnconfirmedOrder = {
  values: StoredOrderFields;
  /** Kết quả tra tên lúc gửi: cần để sau khi khôi phục vẫn qua được cổng tra tên mà không phải sửa form (đã khoá). */
  inquiry: NameInquiry | null;
  mismatchAccepted: boolean;
  savedAt: number;
};

const FIELD_KEYS: (keyof StoredOrderFields)[] = ["merchantRequestCode", "bankCode", "accountNumber", "accountName", "amount", "description"];
const INQUIRY_STATUSES = ["VERIFIED", "NAME_MISMATCH", "UNKNOWN"];

/** Khoá theo user + Sub: người khác đăng nhập chung trình duyệt hay Sub khác không bị dính lệnh này. */
export const unconfirmedOrderKey = (userId: string, subId: string) =>
  `flexpay.disbursement.unconfirmed.v1:${userId}:${subId}`;

function isStoredOrder(value: unknown): value is StoredUnconfirmedOrder {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const values = record["values"] as Record<string, unknown> | null | undefined;
  if (typeof values !== "object" || values === null) return false;
  if (!FIELD_KEYS.every((key) => typeof values[key] === "string")) return false;
  const inquiry = record["inquiry"] as { status?: unknown } | null;
  if (inquiry !== null && !(typeof inquiry === "object" && INQUIRY_STATUSES.includes(String(inquiry.status)))) return false;
  return typeof record["mismatchAccepted"] === "boolean" && typeof record["savedAt"] === "number";
}

export function saveUnconfirmedOrder(key: string, order: StoredUnconfirmedOrder): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(order));
  } catch {
    // Storage hỏng: bỏ qua, khoá trong bộ nhớ vẫn hoạt động.
  }
}

export function loadUnconfirmedOrder(key: string): StoredUnconfirmedOrder | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredOrder(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearUnconfirmedOrder(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Không xoá được thì lần sau còn khoá: an toàn hơn là mất khoá.
  }
}

/**
 * Đăng xuất: xoá mọi bản lưu của user (mọi Sub) để người dùng sau trên cùng máy không đọc được STK/số tiền người nhận.
 * CẦN CHỐT: đăng xuất rồi đăng nhập lại sẽ mất khoá, nên BE idempotency theo mã YC là chốt chặn duy nhất lúc đó.
 */
export function clearUnconfirmedOrdersOfUser(userId: string): void {
  try {
    const prefix = unconfirmedOrderKey(userId, "");
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage không dùng được thì cũng không có gì để xoá.
  }
}
