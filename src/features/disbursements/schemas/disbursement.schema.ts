import { z } from "zod";
import { sensitiveOtpSchema } from "@/lib/schemas/sensitive-otp";

/** Mã yêu cầu của Merchant: BE chống trùng theo (Sub, mã) và chỉ nhận khuôn này, tối đa 50 ký tự. */
export const REQUEST_CODE_PATTERN = /^[A-Za-z0-9._:-]{1,50}$/;
export const REQUEST_CODE_MAX = 50;
export const DESCRIPTION_MAX = 255;
export const ACCOUNT_NAME_MAX = 255;

export const requestCodeSchema = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập mã yêu cầu chi hộ")
  .max(REQUEST_CODE_MAX, `Mã yêu cầu tối đa ${REQUEST_CODE_MAX} ký tự`)
  .regex(REQUEST_CODE_PATTERN, "Mã yêu cầu chỉ gồm chữ không dấu, số và các ký tự . _ : -");

/** Một lệnh chi hộ đơn lẻ như người dùng nhập (số tiền đã là số nguyên VND). */
export const disbursementFormSchema = z.object({
  subId: z.uuid("Vui lòng chọn Sub-merchant chi hộ"),
  merchantRequestCode: requestCodeSchema,
  amount: z.number("Vui lòng nhập số tiền chi").int("Số tiền chi phải là số nguyên").min(1, "Số tiền chi phải lớn hơn 0"),
  bankCode: z.string().trim().min(1, "Vui lòng chọn ngân hàng nhận").max(20, "Mã ngân hàng tối đa 20 ký tự"),
  accountNumber: z.string().trim().min(1, "Vui lòng nhập số tài khoản nhận").max(50, "Số tài khoản tối đa 50 ký tự"),
  accountName: z.string().trim().max(ACCOUNT_NAME_MAX, `Tên người nhận tối đa ${ACCOUNT_NAME_MAX} ký tự`).optional(),
  description: z.string().trim().max(DESCRIPTION_MAX, `Nội dung chi tối đa ${DESCRIPTION_MAX} ký tự`).optional(),
});

export type DisbursementFormData = z.infer<typeof disbursementFormSchema>;

/** Gửi lô: OTP bắt buộc đủ hai nửa; `expectedVersion` là phiên bản lô người dùng vừa xem (QT-11). */
export const batchSubmitBodySchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  sensitiveOtp: sensitiveOtpSchema,
});

export type BatchSubmitBody = z.infer<typeof batchSubmitBodySchema>;

// ------------------------------------------------------------------ phản hồi của BE (qua BFF)

const money = z.number().int();
const optionalMoney = z.number().int().nullish();

export const nameInquirySchema = z.object({
  status: z.enum(["VERIFIED", "NAME_MISMATCH", "UNKNOWN"]),
  bankAccountName: z.string().nullish(),
});

const limitsSchema = z.object({
  perTxnMin: optionalMoney,
  perTxnMax: optionalMoney,
  dailyAmount: optionalMoney,
  dailyCount: z.number().int().nullish(),
  monthlyAmount: optionalMoney,
  monthlyCount: z.number().int().nullish(),
});

export const overviewSchema = z.object({
  subId: z.uuid(),
  service: z.object({
    disbursementEnabled: z.boolean(),
    channels: z.array(z.string()),
    disbursementTopupEnabled: z.boolean(),
    collectionEnabled: z.boolean().optional(),
    refundTopupEnabled: z.boolean().optional(),
    source: z.string().nullish(),
  }),
  limits: limitsSchema.nullish(),
  autoApproveThreshold: optionalMoney,
  fundingMode: z.enum(["PREFUNDED", "POSTFUNDED"]).nullish(),
  creditScope: z.string().nullish(),
  creditLimit: optionalMoney,
  balance: z
    .object({
      available: money,
      overdraft: optionalMoney,
      disbursementReserved: optionalMoney,
      creditLimitRemaining: optionalMoney,
      displayBalance: optionalMoney,
    })
    .nullish(),
  balanceUnavailable: z.boolean(),
});

export const previewSchema = z.object({
  merchantFee: optionalMoney,
  receiverFee: optionalMoney,
  feeBearer: z.string().nullish(),
  feeBearerSupported: z.boolean(),
  feeBearerMessage: z.string().nullish(),
  debitAmount: optionalMoney,
  payoutAmount: optionalMoney,
  autoApprove: z.boolean(),
  perTxnViolation: z.string().nullish(),
  balanceAfter: optionalMoney,
  creditLimitRemainingAfter: optionalMoney,
  estimate: z.boolean(),
});

/** Lệnh chi hộ do disbursement trả về; số tài khoản luôn đã che (`****1234`). */
export const viewSchema = z.object({
  operationId: z.uuid(),
  subId: z.uuid(),
  masterId: z.uuid().nullish(),
  merchantRequestCode: z.string(),
  channel: z.string(),
  batchId: z.uuid().nullish(),
  amount: money,
  merchantFee: optionalMoney,
  receiverFee: optionalMoney,
  debitAmount: optionalMoney,
  payoutAmount: optionalMoney,
  fundingSource: z.string().nullish(),
  beneficiary: z
    .object({
      bankCode: z.string().nullish(),
      bankName: z.string().nullish(),
      accountMasked: z.string().nullish(),
      accountName: z.string().nullish(),
    })
    .nullish(),
  description: z.string().nullish(),
  status: z.string(),
  statusLabel: z.string().nullish(),
  approvalRequired: z.boolean().optional(),
  failureCode: z.string().nullish(),
  createdAt: z.string().nullish(),
  completedAt: z.string().nullish(),
  replayed: z.boolean().optional(),
});

export const topupSchema = z.object({
  orderCode: z.string(),
  purpose: z.string(),
  amount: money,
  transferReference: z.string().nullish(),
  creditedOn: z.string().nullish(),
  status: z.string(),
  statusCode: z.string(),
  decidedAt: z.string().nullish(),
  decisionReason: z.string().nullish(),
  /** UNPOSTED | POSTED với lệnh đã duyệt; BE cũ hoặc lệnh chưa duyệt thì trống. */
  accountingStatus: z.string().nullish(),
});

export const receivingAccountSchema = z.object({
  bankCode: z.string(),
  bankName: z.string().nullish(),
  accountNumber: z.string(),
  accountName: z.string(),
  subCode: z.string().nullish(),
  /** WALLET_ESCROW (đơn trả bằng ví FlexPay) | COLLECTION_DISBURSEMENT (nguồn khác); BE chia sẵn khi chưa chọn giao dịch hoàn. */
  accountType: z.string().nullish(),
});

export const batchValidateResultSchema = z.object({
  batchId: z.uuid(),
  batchCode: z.string(),
  totalRows: z.number().int(),
  validRows: z.number().int(),
  invalidRows: z.number().int(),
  totalAmount: money,
  expiresAt: z.string().nullish(),
  hasErrors: z.boolean(),
  version: z.number().int(),
});

export const batchSummarySchema = z.object({
  batchId: z.uuid(),
  batchCode: z.string(),
  subId: z.uuid(),
  status: z.string(),
  fileName: z.string().nullish(),
  totalRows: z.number().int(),
  validRows: z.number().int(),
  invalidRows: z.number().int(),
  totalAmount: money,
  acceptedCount: z.number().int(),
  refusedCount: z.number().int(),
  unknownCount: z.number().int(),
  expiresAt: z.string().nullish(),
  submittedAt: z.string().nullish(),
  createdAt: z.string().nullish(),
  version: z.number().int(),
});

export const batchLineSchema = z.object({
  lineNo: z.number().int(),
  merchantRequestCode: z.string().nullish(),
  bankCode: z.string().nullish(),
  accountMasked: z.string().nullish(),
  accountName: z.string().nullish(),
  amount: optionalMoney,
  description: z.string().nullish(),
  status: z.string(),
  validationError: z.string().nullish(),
  resultCode: z.string().nullish(),
  resultMessage: z.string().nullish(),
  operationId: z.string().nullish(),
});

/**
 * Tổng hợp trạng thái lệnh của một lô (disbursement trả đủ 7 khoá trạng thái hiển thị). Khoá thiếu được coi là 0.
 * Không có số tài khoản hay tên người nhận ở đây.
 */
export const batchAggregateSchema = z.object({
  batchId: z.uuid(),
  orderCount: z.number().int(),
  countsByStatus: z.record(z.string(), z.number().int()),
  totalAmount: money,
  succeededAmount: money,
});

/**
 * Chi tiết lô. `summary` null khi lô chưa gửi / chưa có lệnh / không đọc được (`summaryUnavailable`); hai trường là
 * tuỳ chọn để BE cũ chưa có khối tổng hợp vẫn đọc được.
 */
export const batchDetailSchema = z.object({
  batch: batchSummarySchema,
  lines: z.array(batchLineSchema),
  summary: batchAggregateSchema.nullish(),
  summaryUnavailable: z.boolean().optional(),
});

/** Một dòng danh sách lô Portal: lô ở flex.merchant + tổng hợp lệnh từ disbursement (null như ở chi tiết lô). */
export const batchListItemSchema = z.object({
  batch: batchSummarySchema,
  summary: batchAggregateSchema.nullish(),
});

export const batchListSchema = z.object({
  items: z.array(batchListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  size: z.number().int(),
  summaryUnavailable: z.boolean().optional(),
});

// ------------------------------------------------------------------ danh sách / chi tiết lệnh (GĐ5 Task 5.12)

const beneficiarySchema = z
  .object({
    bankCode: z.string().nullish(),
    bankName: z.string().nullish(),
    accountMasked: z.string().nullish(),
    accountName: z.string().nullish(),
  })
  .nullish();

/**
 * Một dòng danh sách lệnh (`MerchantDisbursementView` đã che STK). Trường lạ BE thêm sau bị bỏ (zod strip) nên màn
 * hình chỉ thấy những gì hợp đồng Portal cho phép.
 */
export const orderItemSchema = z.object({
  operationId: z.uuid(),
  subId: z.uuid(),
  masterId: z.uuid().nullish(),
  merchantRequestCode: z.string(),
  channel: z.string(),
  batchId: z.uuid().nullish(),
  amount: money,
  merchantFee: optionalMoney,
  receiverFee: optionalMoney,
  debitAmount: optionalMoney,
  payoutAmount: optionalMoney,
  fundingSource: z.string().nullish(),
  beneficiary: beneficiarySchema,
  description: z.string().nullish(),
  status: z.string(),
  statusLabel: z.string().nullish(),
  failureCode: z.string().nullish(),
  createdAt: z.string().nullish(),
  completedAt: z.string().nullish(),
  retryOfOperationId: z.uuid().nullish(),
  retriedByOperationId: z.uuid().nullish(),
  retryAttempt: z.number().int().nullish(),
  hasReturn: z.boolean().optional(),
  merchantReason: z.string().nullish(),
});

export const orderSearchPageSchema = z.object({
  items: z.array(orderItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  size: z.number().int(),
});

const feeSchema = z.object({
  beforeVat: money,
  vat: money,
  discount: money,
  afterVat: money,
  merchantFee: money,
  receiverFee: money,
  debitAmount: money,
  payoutAmount: money,
});

/**
 * Chi tiết lệnh cho Portal (`MerchantPortalDetailView`): đã bỏ người duyệt, lỗi thô, id sổ, bằng chứng, chứng từ và
 * phần lấy từ hạn mức dự phòng. Schema KHÔNG khai các trường đó; nếu BE lỡ gửi thì zod bỏ đi trước khi tới giao diện.
 */
export const orderDetailSchema = z.object({
  operationId: z.uuid(),
  subId: z.uuid(),
  masterId: z.uuid().nullish(),
  merchantRequestCode: z.string(),
  channel: z.string(),
  batchId: z.uuid().nullish(),
  amount: money,
  fundingSource: z.string().nullish(),
  beneficiary: beneficiarySchema,
  status: z.string(),
  statusLabel: z.string().nullish(),
  bankReference: z.string().nullish(),
  failureCode: z.string().nullish(),
  merchantReason: z.string().nullish(),
  fee: feeSchema.nullish(),
  timeline: z.array(z.object({ status: z.string(), label: z.string(), at: z.string().nullish() })).default([]),
  returns: z
    .array(
      z.object({
        returnCode: z.string(),
        principal: money,
        feeRefund: money,
        returnedAt: z.string().nullish(),
        statusLabel: z.string().nullish(),
      }),
    )
    .default([]),
  hasReturn: z.boolean().optional(),
  retryOfOperationId: z.uuid().nullish(),
  retriedByOperationId: z.uuid().nullish(),
  /** Lệnh này là lần chi lại thứ mấy của lệnh gốc (1, 2, ...); null/vắng với lệnh gốc hoặc BE cũ. */
  retryAttempt: z.number().int().nullish(),
  /**
   * Mọi lần chi lại của lệnh gốc, cũ trước mới sau (disbursement D1, 19/11): một lệnh có thể chi lại nhiều lần khi lần
   * trước thất bại. `retriedByOperationId` vẫn là lần mới nhất. BE cũ không gửi mảng này thì đọc là rỗng.
   */
  retries: z
    .array(
      z.object({
        operationId: z.uuid(),
        attempt: z.number().int(),
        status: z.string(),
        statusLabel: z.string().nullish(),
        createdAt: z.string().nullish(),
      }),
    )
    .nullish()
    .transform((value) => value ?? []),
  createdAt: z.string().nullish(),
  completedAt: z.string().nullish(),
});

// ------------------------------------------------------------------ thân yêu cầu từ trình duyệt tới BFF

const subIdField = z.uuid("Vui lòng chọn Sub-merchant chi hộ");

export const nameInquiryBodySchema = z.object({
  subId: subIdField,
  bankCode: disbursementFormSchema.shape.bankCode,
  accountNumber: disbursementFormSchema.shape.accountNumber,
  accountName: z.string().trim().max(ACCOUNT_NAME_MAX, `Tên người nhận tối đa ${ACCOUNT_NAME_MAX} ký tự`).optional(),
});

export const previewBodySchema = z.object({
  subId: subIdField,
  amount: disbursementFormSchema.shape.amount,
  bankCode: disbursementFormSchema.shape.bankCode,
});

/** OTP gắn đúng Sub + mã yêu cầu + số tiền + người nhận; BE kiểm lại khi tạo lệnh. */
export const otpChallengeBodySchema = z.object({
  subId: subIdField,
  merchantRequestCode: requestCodeSchema,
  amount: disbursementFormSchema.shape.amount,
  bankCode: disbursementFormSchema.shape.bankCode,
  accountNumber: disbursementFormSchema.shape.accountNumber,
});

export const createBodySchema = disbursementFormSchema.extend({
  nameMismatchAccepted: z.boolean(),
  sensitiveOtp: sensitiveOtpSchema,
});
