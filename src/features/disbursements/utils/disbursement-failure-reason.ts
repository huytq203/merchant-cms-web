/**
 * Lý do Thất bại / Đã hủy của lệnh chi hộ theo `failureCode` (= `last_error` của disbursement, đã lọc chỉ còn mã dạng
 * `A-Z0-9_`, mã không đọc được thành `UNSPECIFIED`). Portal không được hiện mã thô cho Merchant (chốt 20/11), nên mọi
 * màn hiển thị lý do (danh sách, chi tiết lệnh) dùng chung bảng này, không tự viết câu riêng.
 *
 * Nguồn câu:
 * - Mã từ chối của sổ (wallet-core): chép nguyên câu của bảng `REFUSALS` trong
 *   `InternalSubDisbursementController` (wallet-core) để Portal, Admin và BE nói cùng một câu. Bảng phủ đủ
 *   `SubLedgerClient.DEFINITE_REFUSALS` của disbursement. Đổi câu ở BE thì sửa ở đây cho khớp.
 * - Mã kết thúc lệnh do disbursement tự ghi (ngân hàng từ chối, xử lý tay, cổng thanh toán hủy...): câu mô tả theo
 *   nghĩa ghi trong code disbursement (`OrderProcessor`, `OrderOperations`, `MerchantOrderResults`).
 * Mã chưa có trong bảng: câu chung kèm mã để Merchant gửi khi cần tra soát.
 */
export const DISBURSEMENT_FAILURE_REASONS: Readonly<Record<string, string>> = {
  // ---- Từ chối của sổ wallet-core (InternalSubDisbursementController.REFUSALS)
  SERVICE_DISABLED: "Dịch vụ chi hộ đang tắt",
  PER_TXN_LIMIT: "Số tiền ngoài hạn mức mỗi lệnh chi hộ",
  DAILY_AMOUNT_LIMIT: "Vượt hạn mức chi hộ trong ngày",
  DAILY_COUNT_LIMIT: "Vượt số lệnh chi hộ tối đa trong ngày",
  MONTHLY_AMOUNT_LIMIT: "Vượt hạn mức chi hộ trong tháng",
  MONTHLY_COUNT_LIMIT: "Vượt số lệnh chi hộ tối đa trong tháng",
  INSUFFICIENT_AVAILABLE: "Số dư thu-chi hộ khác không đủ",
  CREDIT_LIMIT_EXCEEDED: "Vượt hạn mức thanh khoản dự phòng",
  CREDIT_LIMIT_BELOW_OUTSTANDING:
    "Dư nợ Trả sau hiện vượt hạn mức thanh khoản dự phòng mới, không thể tạo yêu cầu chi hộ cho tới khi trả bớt nợ",
  REQUEST_ALREADY_RESERVED: "Mã yêu cầu đã được dùng",
  INVALID_ALLOCATION: "Cách phân bổ tiền của lệnh không hợp lệ",
  RESERVATION_NOT_CAPTURED: "Lệnh chi hộ chưa được chốt nên chưa thể hoàn trả hoặc xoá tài khoản trung gian phải chi",
  PAYOUT_ALREADY_CLEARED: "Lệnh chi hộ đã được xoá tài khoản trung gian phải chi",
  REVERSAL_EXCEEDS_SOURCE: "Số tiền hoàn trả vượt số tiền đã chi của lệnh gốc",
  FEE_REFUND_EXCEEDS_SOURCE: "Số phí hoàn trả vượt số phí đã thu của lệnh gốc",
  SOURCE_ALREADY_POSTED: "Mã hoàn trả đã được dùng cho một khoản tiền khác",
  RESERVATION_CLOSED: "Lệnh giữ chỗ đã được chốt hoặc nhả trước đó",
  OWNER_SCOPE: "Lệnh không thuộc Sub-merchant hoặc Master này",
  REQUEST_MISMATCH: "Mã yêu cầu không khớp với lệnh giữ chỗ",
  SOURCE_CLOSED: "Nguồn tiền của lệnh đã đóng",
  UNBALANCED_POSTING: "Bút toán của lệnh không cân",
  INVALID_POSTING_EVIDENCE: "Chứng từ ghi sổ của lệnh không hợp lệ",
  ACCOUNTING_PERIOD_MISSING: "Chưa có kỳ kế toán cho ngày ghi sổ của lệnh",
  ACCOUNTING_PERIOD_CLOSED: "Kỳ kế toán của ngày ghi sổ đã đóng",
  GL_PROFILE_MISSING: "Tài khoản kế toán của bút toán chưa được khai báo hoặc đang ngừng hoạt động",
  INVALID_CONTRACT: "Cấu hình hợp đồng chi hộ của lệnh không hợp lệ",
  FEATURE_DISABLED: "Sổ tài chính merchant chưa được bật",

  // ---- Kết thúc lệnh do disbursement ghi (không phải mã của sổ)
  BANK_REJECTED: "Ngân hàng từ chối giao dịch",
  PAYOUT_NOT_ACCEPTED: "Cổng thanh toán không nhận lệnh chi",
  PAYOUT_OPERATION_VOIDED: "Lệnh chi đã được hủy tại cổng thanh toán",
  MANUAL_GATEWAY_VOIDED: "Lệnh chi đã được hủy tại cổng thanh toán",
  MANUAL_NOT_PAID: "Lệnh chi thủ công được xác nhận là chưa chi",
  MANUAL_FAILED_BEFORE_DISPATCH: "Lệnh được xác nhận thất bại trước khi gửi sang ngân hàng",
  FEE_QUOTE_EXPIRED: "Báo giá phí của lệnh đã hết hạn",
  FEE_SNAPSHOT_INVALID: "Thông tin phí của lệnh không hợp lệ",
  LIQUIDITY_LIMIT_NOT_CONFIGURED: "Chưa cấu hình hạn mức thanh khoản dự phòng",
  // BE che mã không đúng dạng thành UNSPECIFIED: không có gì để thêm ngoài "thất bại".
  UNSPECIFIED: "Giao dịch thất bại",
};

/** Câu lý do Thất bại cho một `failureCode`; null khi không có mã (lệnh chưa thất bại hoặc BE không ghi). */
export function disbursementFailureReason(code: string | null | undefined): string | null {
  const key = code?.trim();
  if (!key) return null;
  // hasOwn: không lấy nhầm thuộc tính của Object.prototype khi mã trùng tên (ví dụ "constructor").
  return Object.hasOwn(DISBURSEMENT_FAILURE_REASONS, key) ? DISBURSEMENT_FAILURE_REASONS[key]! : `Giao dịch thất bại (mã: ${key})`;
}
