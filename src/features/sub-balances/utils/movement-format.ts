import { formatAmount } from "@/lib/utils/helper";

/** U+2212, a real minus sign: a hyphen reads as a dash next to digits and is easy to miss in a column of amounts. */
const MINUS = "−";

/** `+1.330.200 vnđ` / `−2.000.000 vnđ`; zero carries no sign. */
export function formatSignedAmount(amount: number): string {
  if (amount > 0) return `+${formatAmount(amount)}`;
  if (amount < 0) return `${MINUS}${formatAmount(-amount)}`;
  return formatAmount(0);
}

/** Credits are shown in the success color; debits keep the default text color (red would read as an error). */
export const amountToneClass = (amount: number): string => (amount > 0 ? "text-success" : "text-foreground");

/** Nhãn của kiểu biến động dùng cho chip lọc; nhãn từng dòng luôn lấy từ `label` của BE. */
export const MOVEMENT_TYPE_LABELS = { DISBURSEMENT: "Chi hộ", TOPUP: "Nạp tiền" } as const;

/**
 * "Số dư sau" của một dòng. Ở ngăn thu-chi hộ khác số hiển thị = khả dụng − dư nợ Trả sau nên có thể ÂM (CẦN CHỐT 9 GĐ7):
 * hiện dấu "−" thật, không để dấu gạch nối.
 */
export function formatBalance(balance: number): string {
  return balance < 0 ? `${MINUS}${formatAmount(-balance)}` : formatAmount(balance);
}

/** Số dư âm = đang nợ Trả sau nhiều hơn số có: tô đỏ để không đọc nhầm; số dư dương giữ màu phụ như cũ. */
export const balanceToneClass = (balance: number): string => (balance < 0 ? "text-danger" : "text-muted-foreground");

/** Khoảng ngày xuất CSV tối đa (tính cả ngày đầu và cuối), cùng quy tắc BE (6334 là trần số dòng, không phải số ngày). */
const MAX_EXPORT_DAYS = 93;
const DAY_MS = 86_400_000;

/**
 * Kiểm khoảng ngày trước khi gọi BE xuất CSV để khoảng sai không rời trình duyệt; BE vẫn kiểm lại và là nguồn quyết định.
 * Trả về câu tiếng Việt, hoặc null khi hợp lệ.
 */
export function exportRangeError(fromDate: string | undefined, toDate: string | undefined): string | null {
  if (!fromDate || !toDate) return "Vui lòng chọn Từ ngày và Đến ngày để xuất file";
  const days = (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / DAY_MS + 1;
  if (Number.isNaN(days)) return "Từ ngày hoặc Đến ngày không hợp lệ";
  if (days < 1) return "Từ ngày không được sau Đến ngày";
  if (days > MAX_EXPORT_DAYS) return `Khoảng thời gian xuất tối đa ${MAX_EXPORT_DAYS} ngày`;
  return null;
}
