import type {
  BatchAggregate,
  BatchDetail,
  BatchListResult,
  DisbursementOverview,
  DisbursementPreview,
  DisbursementView,
  NameInquiry,
  OrderDetail,
  OrderItem,
  OrderSearchPage,
} from "../types/types";

export const SUB_ID = "11111111-1111-4111-8111-111111111111";

/** Tổng quan của một Sub đã bật Chi hộ đơn lẻ + lô, trả trước, còn quỹ. */
export const overviewFixture: DisbursementOverview = {
  subId: SUB_ID,
  service: {
    disbursementEnabled: true,
    channels: ["SINGLE", "BATCH"],
    disbursementTopupEnabled: true,
    collectionEnabled: true,
    refundTopupEnabled: false,
    source: "SUB",
  },
  limits: { perTxnMin: 10_000, perTxnMax: 500_000_000, dailyAmount: null, dailyCount: null, monthlyAmount: null, monthlyCount: null },
  autoApproveThreshold: 50_000_000,
  fundingMode: "PREFUNDED",
  creditScope: null,
  creditLimit: null,
  balance: { available: 5_000_000, overdraft: 0, disbursementReserved: 0, creditLimitRemaining: null, displayBalance: 5_000_000 },
  balanceUnavailable: false,
};

export const previewFixture: DisbursementPreview = {
  merchantFee: 1_100,
  receiverFee: 0,
  feeBearer: "MERCHANT",
  feeBearerSupported: true,
  feeBearerMessage: null,
  debitAmount: 1_001_100,
  payoutAmount: 1_000_000,
  autoApprove: true,
  perTxnViolation: null,
  balanceAfter: 3_998_900,
  creditLimitRemainingAfter: null,
  estimate: true,
};

export const verifiedInquiry: NameInquiry = { status: "VERIFIED", bankAccountName: "NGUYEN VAN A" };

export const viewFixture: DisbursementView = {
  operationId: "33333333-3333-4333-8333-333333333333",
  subId: SUB_ID,
  masterId: "44444444-4444-4444-8444-444444444444",
  merchantRequestCode: "P2611191200000001",
  channel: "SINGLE",
  batchId: null,
  amount: 1_000_000,
  merchantFee: 1_100,
  receiverFee: 0,
  debitAmount: 1_001_100,
  payoutAmount: 1_000_000,
  fundingSource: "PREFUNDED",
  beneficiary: { bankCode: "VCB", bankName: "Vietcombank", accountMasked: "****6789", accountName: "NGUYEN VAN A" },
  description: "Chi hộ",
  status: "PROCESSING",
  statusLabel: "Đang xử lý",
  approvalRequired: false,
  failureCode: null,
  createdAt: "2026-11-19T05:00:00Z",
  completedAt: null,
  replayed: false,
};

/** Lô nháp còn hạn 30 phút: 3 dòng hợp lệ + 1 dòng lỗi, chưa gửi. */
export const BATCH_ID = "55555555-5555-4555-8555-555555555555";
export const batchDetailFixture: BatchDetail = {
  batch: {
    batchId: BATCH_ID,
    batchCode: "LO-001",
    subId: SUB_ID,
    status: "DRAFT",
    fileName: "lo.csv",
    totalRows: 4,
    validRows: 3,
    invalidRows: 1,
    totalAmount: 3_000_000,
    acceptedCount: 0,
    refusedCount: 0,
    unknownCount: 0,
    expiresAt: new Date(Date.now() + 25 * 60_000).toISOString(),
    submittedAt: null,
    createdAt: "2026-11-19T05:00:00Z",
    version: 7,
  },
  lines: [
    { lineNo: 1, merchantRequestCode: "R1", bankCode: "VCB", accountMasked: "****6789", amount: 1_000_000, status: "PENDING" },
    { lineNo: 4, merchantRequestCode: null, bankCode: null, accountMasked: null, amount: null, status: "INVALID", validationError: "Thiếu số tài khoản" },
  ],
};

// ------------------------------------------------------------------ danh sách / chi tiết lệnh (Task 5.15)

export const ORDER_ID = "66666666-6666-4666-8666-666666666666";
export const RETRY_ORDER_ID = "77777777-7777-4777-8777-777777777777";

export const orderItemFixture: OrderItem = {
  operationId: ORDER_ID,
  subId: SUB_ID,
  masterId: "44444444-4444-4444-8444-444444444444",
  merchantRequestCode: "PAY-0001",
  channel: "API",
  batchId: null,
  amount: 5_000_000,
  merchantFee: 3_300,
  receiverFee: 0,
  debitAmount: 5_003_300,
  payoutAmount: 5_000_000,
  fundingSource: "PREFUNDED",
  beneficiary: { bankCode: "VPB", bankName: "VPBank", accountMasked: "****7890", accountName: "NGUYEN VAN KIEN" },
  description: "Chi hộ tháng 11",
  status: "SUCCEEDED",
  statusLabel: "Thành công",
  failureCode: null,
  createdAt: "2026-11-18T02:30:00Z",
  completedAt: "2026-11-18T02:31:00Z",
  retryOfOperationId: null,
  retriedByOperationId: null,
  hasReturn: false,
  merchantReason: null,
};

export const orderPendingFixture: OrderItem = {
  ...orderItemFixture,
  operationId: "88888888-8888-4888-8888-888888888888",
  merchantRequestCode: "L11-001",
  channel: "BATCH",
  batchId: BATCH_ID,
  amount: 70_000_000,
  debitAmount: 70_003_300,
  payoutAmount: 0,
  beneficiary: { bankCode: "VCB", bankName: "Vietcombank", accountMasked: "****4411", accountName: "TRAN THI B" },
  status: "PENDING_APPROVAL",
  statusLabel: "Chờ duyệt",
  completedAt: null,
};

export const orderPageFixture: OrderSearchPage = { items: [orderItemFixture, orderPendingFixture], total: 2, page: 0, size: 10 };

export const orderDetailFixture: OrderDetail = {
  operationId: ORDER_ID,
  subId: SUB_ID,
  masterId: "44444444-4444-4444-8444-444444444444",
  merchantRequestCode: "PAY-0001",
  channel: "API",
  batchId: null,
  amount: 5_000_000,
  fundingSource: "PREFUNDED",
  beneficiary: { bankCode: "VPB", bankName: "VPBank", accountMasked: "****7890", accountName: "NGUYEN VAN KIEN" },
  status: "SUCCEEDED",
  statusLabel: "Thành công",
  bankReference: "FT2611180012",
  failureCode: null,
  merchantReason: null,
  fee: { beforeVat: 3_000, vat: 300, discount: 0, afterVat: 3_300, merchantFee: 3_300, receiverFee: 0, debitAmount: 5_003_300, payoutAmount: 5_000_000 },
  timeline: [
    { status: "PENDING_APPROVAL", label: "Chờ duyệt", at: "2026-11-18T09:30:00+07:00" },
    { status: "PROCESSING", label: "Đang xử lý", at: "2026-11-18T09:30:20+07:00" },
    { status: "SUCCEEDED", label: "Thành công", at: "2026-11-18T09:31:00+07:00" },
  ],
  returns: [],
  hasReturn: false,
  retryOfOperationId: null,
  retriedByOperationId: null,
  retryAttempt: null,
  retries: [],
  createdAt: "2026-11-18T09:30:00+07:00",
  completedAt: "2026-11-18T09:31:00+07:00",
};

/** Lô đã gửi: 10 lệnh, 6 đã có kết cục. */
export const batchAggregateFixture: BatchAggregate = {
  batchId: BATCH_ID,
  orderCount: 10,
  countsByStatus: { PENDING_APPROVAL: 1, APPROVED_AWAITING_DISPATCH: 0, PROCESSING: 2, UNKNOWN: 1, SUCCEEDED: 4, FAILED: 1, CANCELLED: 1 },
  totalAmount: 10_000_000,
  succeededAmount: 4_000_000,
};

export const batchListFixture: BatchListResult = {
  items: [
    { batch: { ...batchDetailFixture.batch, status: "SUBMITTING", submittedAt: "2026-11-19T05:10:00Z", acceptedCount: 10 }, summary: batchAggregateFixture },
    { batch: { ...batchDetailFixture.batch, batchId: "99999999-9999-4999-8999-999999999999", batchCode: "LO-002", status: "DRAFT" }, summary: null },
  ],
  total: 2,
  page: 0,
  size: 10,
  summaryUnavailable: false,
};
