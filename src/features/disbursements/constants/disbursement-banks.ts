import { BANK_OPTIONS } from "@/features/bank-accounts/constants/bank-options";

/**
 * Ngân hàng nhận của lệnh chi hộ. CẦN CHỐT: BE chưa có endpoint danh mục ngân hàng cho chi hộ (lô CSV chỉ kiểm theo danh
 * mục cấu hình `MERCHANT_DISBURSEMENT_BATCH_BANK_CODES`; lệnh đơn lẻ gửi nguyên mã cho disbursement). Tạm dùng danh mục
 * của màn tài khoản ngân hàng cộng VPB (mock dev có VPB); khi BE có endpoint thì thay file này.
 */
export const DISBURSEMENT_BANK_OPTIONS = [
  ...BANK_OPTIONS.map((bank) => ({ value: bank.value as string, label: bank.label as string })),
  { value: "VPB", label: "VPBank" },
] as const;
