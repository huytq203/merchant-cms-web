// Merchant Portal endpoints (`/api/v1/merchant/disbursements`, flex.merchant MerchantDisbursementPortalController).
// Quyền BE: màn xem cần VIEW_DISBURSEMENT; tra tên, xem trước, OTP, tạo lệnh, lô cần CREATE_DISBURSEMENT. Sub ngoài phạm
// vi phiên = 404. Danh sách/chi tiết/xuất lệnh (GĐ5): VIEW_DISBURSEMENT, riêng xuất cần EXPORT_DISBURSEMENT. Số trang của danh sách nạp là 1-based (`page`, `size`).
const MERCHANT = "/api/v1/merchant/disbursements";
const id = encodeURIComponent;

export const disbursementPaths = {
  overview: (subId: string) => `${MERCHANT}/subs/${id(subId)}/overview`,
  nameInquiry: `${MERCHANT}/name-inquiry`,
  preview: `${MERCHANT}/preview`,
  otpChallenge: `${MERCHANT}/otp-challenge`,
  create: MERCHANT,
  find: (subId: string, code: string) => `${MERCHANT}/subs/${id(subId)}/requests/${id(code)}`,
  batchTemplate: `${MERCHANT}/batches/template.csv`,
  batchValidate: `${MERCHANT}/batches/validate`,
  batch: (batchId: string) => `${MERCHANT}/batches/${id(batchId)}`,
  batchErrors: (batchId: string) => `${MERCHANT}/batches/${id(batchId)}/errors.csv`,
  batchOtpChallenge: (batchId: string) => `${MERCHANT}/batches/${id(batchId)}/otp-challenge`,
  batchSubmit: (batchId: string) => `${MERCHANT}/batches/${id(batchId)}/submit`,
  search: `${MERCHANT}/search`,
  order: (operationId: string) => `${MERCHANT}/orders/${id(operationId)}`,
  export: `${MERCHANT}/export`,
  batches: `${MERCHANT}/batches`,
  topups: (subId: string) => `${MERCHANT}/subs/${id(subId)}/topups`,
  receivingAccounts: `${MERCHANT}/receiving-accounts`,
} as const;
