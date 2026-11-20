import { describe, expect, it } from "vitest";
import {
  availableModes,
  balanceSummary,
  batchErrorFileUrl,
  createBlockReason,
  generateRequestCode,
  parseAmountInput,
  summarizeBatch,
  topupStatusLabel,
  validateBatchFile,
} from "../disbursement-mapper";
import { overviewFixture, previewFixture, verifiedInquiry } from "../../test/fixtures";
import type { NameInquiry } from "../../types/types";

const ready = { inquiry: verifiedInquiry, mismatchAccepted: false, preview: previewFixture };

describe("createBlockReason", () => {
  it("createBlockedUntilNameInquiryVerifiedOrMismatchTicked", () => {
    // Chưa tra tên: chặn.
    expect(createBlockReason({ ...ready, inquiry: null })).toMatch(/tra tên/i);
    // Tên khác ngân hàng: chặn tới khi tick xác nhận.
    const mismatch: NameInquiry = { status: "NAME_MISMATCH", bankAccountName: "TRAN THI B" };
    expect(createBlockReason({ ...ready, inquiry: mismatch })).toMatch(/xác nhận/);
    expect(createBlockReason({ ...ready, inquiry: mismatch, mismatchAccepted: true })).toBeNull();
    // Tên khớp: cho đi tiếp.
    expect(createBlockReason(ready)).toBeNull();
  });

  it("unknownInquiryBlocksSubmit", () => {
    const unknown: NameInquiry = { status: "UNKNOWN", bankAccountName: null };
    expect(createBlockReason({ ...ready, inquiry: unknown })).toMatch(/chưa tra được/i);
    // Tick xác nhận không mở khóa được trạng thái chưa biết.
    expect(createBlockReason({ ...ready, inquiry: unknown, mismatchAccepted: true })).not.toBeNull();
  });

  it("blocks a fee bearer BE cannot process and a per-transaction limit violation", () => {
    const receiver = { ...previewFixture, feeBearer: "RECEIVER", feeBearerSupported: false, feeBearerMessage: "Chi hộ chỉ nhận biểu phí do Merchant chịu" };
    expect(createBlockReason({ ...ready, preview: receiver })).toBe("Chi hộ chỉ nhận biểu phí do Merchant chịu");
    expect(createBlockReason({ ...ready, preview: { ...previewFixture, perTxnViolation: "ABOVE_MAX" } })).toMatch(/tối đa/);
    expect(createBlockReason({ ...ready, preview: { ...previewFixture, perTxnViolation: "BELOW_MIN" } })).toMatch(/tối thiểu/);
  });
});

describe("generateRequestCode", () => {
  it("makes P + yyMMddHHmmss + 4 characters that satisfy the BE pattern", () => {
    const code = generateRequestCode(new Date(2026, 10, 19, 13, 5, 9), () => 0.5);
    expect(code).toMatch(/^P261119130509[A-Z0-9]{4}$/);
    expect(code).toMatch(/^[A-Za-z0-9._:-]{1,50}$/);
  });
});

describe("availableModes", () => {
  it("channelNotEnabledHidesSingleOrBatch", () => {
    expect(availableModes(overviewFixture.service)).toEqual({ single: true, batch: true });
    expect(availableModes({ ...overviewFixture.service, channels: ["BATCH"] })).toEqual({ single: false, batch: true });
    expect(availableModes({ ...overviewFixture.service, channels: ["SINGLE", "API"] })).toEqual({ single: true, batch: false });
    // Dịch vụ tắt thì không còn hình thức nào, kể cả khi danh sách kênh còn dữ liệu cũ.
    expect(availableModes({ ...overviewFixture.service, disbursementEnabled: false })).toEqual({ single: false, batch: false });
  });
});

describe("balanceSummary", () => {
  it("negativeBalanceShownForPostfunded", () => {
    const postfunded = {
      ...overviewFixture,
      fundingMode: "POSTFUNDED" as const,
      creditLimit: 20_000_000,
      balance: { available: 0, overdraft: 5_000_000, disbursementReserved: 0, creditLimitRemaining: 15_000_000, displayBalance: -5_000_000 },
    };
    const summary = balanceSummary(postfunded);
    expect(summary.negative).toBe(true);
    expect(summary.text).toContain("-5.000.000");
    expect(summary.caption).toMatch(/Trả sau/);
    expect(balanceSummary(overviewFixture).negative).toBe(false);
  });

  it("does not invent a number when the ledger could not be read", () => {
    const summary = balanceSummary({ ...overviewFixture, balance: null, balanceUnavailable: true });
    expect(summary.text).toBe("Chưa đọc được số dư");
  });
});

describe("topupStatusLabel", () => {
  it("topupStatusLabelsVietnamese", () => {
    expect(topupStatusLabel("PENDING_APPROVAL")).toBe("Chờ duyệt");
    expect(topupStatusLabel("APPROVING")).toBe("Đang ghi nhận");
    expect(topupStatusLabel("APPROVED")).toBe("Đã ghi nhận");
    expect(topupStatusLabel("REJECTED")).toBe("Từ chối");
    expect(topupStatusLabel("CANCELLED")).toBe("Đã hủy");
    // Mã BE thêm sau này vẫn hiện được, không rơi thành rỗng.
    expect(topupStatusLabel("NEW_STATUS")).toBe("NEW_STATUS");
  });
});

describe("validateBatchFile", () => {
  const file = (name: string, size: number) => new File([new Uint8Array(size)], name, { type: "text/csv" });

  it("batchUploadRejectsNonCsvAndOver2MB", () => {
    expect(validateBatchFile(file("lo.csv", 1024))).toBeNull();
    expect(validateBatchFile(file("LO.CSV", 1024))).toBeNull();
    expect(validateBatchFile(file("lo.xlsx", 1024))).toMatch(/CSV/);
    expect(validateBatchFile(file("lo.csv.exe", 1024))).toMatch(/CSV/);
    expect(validateBatchFile(file("lo.csv", 2 * 1024 * 1024))).toBeNull();
    expect(validateBatchFile(file("lo.csv", 2 * 1024 * 1024 + 1))).toMatch(/2 ?MB/);
    expect(validateBatchFile(file("lo.csv", 0))).toMatch(/rỗng/);
  });
});

describe("summarizeBatch", () => {
  const batch = {
    batchId: "55555555-5555-4555-8555-555555555555", batchCode: "LO-1", subId: "s", status: "COMPLETED", fileName: "lo.csv",
    totalRows: 10, validRows: 8, invalidRows: 2, totalAmount: 8_000_000, acceptedCount: 6, refusedCount: 1, unknownCount: 1,
    expiresAt: null, submittedAt: "2026-11-19T05:00:00Z", createdAt: "2026-11-19T04:00:00Z", version: 3,
  };

  it("batchSummaryCountsAndErrorFileLink", () => {
    const summary = summarizeBatch(batch);
    expect(summary.counts).toEqual({ total: 10, valid: 8, invalid: 2, accepted: 6, refused: 1, unknown: 1, pending: 0 });
    // File lỗi gồm dòng lỗi lúc tải (2) và dòng bị từ chối sau khi gửi (1).
    expect(summary.errorRows).toBe(3);
    expect(summary.errorFileUrl).toBe(`/api/v1/admin/disbursements/batches/${batch.batchId}/errors`);
    expect(batchErrorFileUrl(batch.batchId)).toBe(summary.errorFileUrl);
  });

  it("has no error file link when nothing failed, and counts still-sending rows as pending", () => {
    const clean = summarizeBatch({ ...batch, invalidRows: 0, refusedCount: 0, acceptedCount: 5, unknownCount: 1, status: "SUBMITTING" });
    expect(clean.errorFileUrl).toBeNull();
    expect(clean.counts.pending).toBe(2);
    expect(clean.statusLabel).toBe("Đang gửi");
  });
});

describe("parseAmountInput", () => {
  it("accepts dot/comma thousand separators", () => {
    expect(parseAmountInput("1.000.000")).toBe(1_000_000);
    expect(parseAmountInput("1,000,000")).toBe(1_000_000);
    expect(parseAmountInput("1 000 000")).toBe(1_000_000);
  });
  it("rejects a decimal part instead of reading '100,5' as 1.005", () => {
    expect(parseAmountInput("100,5")).toBeNaN();
    expect(parseAmountInput("100.50")).toBeNaN();
  });
  it("rejects letters and empty input", () => {
    expect(parseAmountInput("abc")).toBeNaN();
    expect(parseAmountInput("")).toBeNaN();
  });
});
