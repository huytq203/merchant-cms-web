import { describe, expect, it } from "vitest";
import {
  batchStatusTone,
  DISBURSEMENT_STATUS_OPTIONS,
  DISBURSEMENT_STATUSES,
  batchProgress,
  channelLabel,
  fundingSourceLabel,
  statusLabel,
  statusTone,
} from "../disbursement-status";

describe("disbursement-status", () => {
  it("sevenStatusLabelsMatchBackend", () => {
    // Nhãn đúng từng chữ với MerchantDisbursementStatus của disbursement (kể cả dấu gạch "–").
    expect(DISBURSEMENT_STATUSES.map(statusLabel)).toEqual([
      "Chờ duyệt",
      "Đã duyệt – chờ chi",
      "Đang xử lý",
      "Chưa rõ kết quả",
      "Thành công",
      "Thất bại",
      "Đã hủy",
    ]);
    expect(DISBURSEMENT_STATUS_OPTIONS.map((option) => option.value)).toEqual([...DISBURSEMENT_STATUSES]);
  });

  it("falls back to the raw code for a status the BE adds later, and to a neutral tone", () => {
    expect(statusLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
    expect(statusTone("SOMETHING_NEW")).toBe("neutral");
  });

  it("colours success green, failure red and the unsure ones amber", () => {
    expect(statusTone("SUCCEEDED")).toBe("success");
    expect(statusTone("FAILED")).toBe("danger");
    expect(statusTone("UNKNOWN")).toBe("warning");
    expect(statusTone("PENDING_APPROVAL")).toBe("warning");
    expect(statusTone("CANCELLED")).toBe("neutral");
  });

  it("names the channel and the funding source without exposing the internal reserve", () => {
    expect(channelLabel("SINGLE")).toBe("Đơn lẻ");
    expect(channelLabel("BATCH")).toBe("Lô");
    expect(channelLabel("API")).toBe("API");
    expect(fundingSourceLabel("POSTFUNDED")).toBe("Trả sau");
    expect(fundingSourceLabel("PREFUNDED")).toBe("Trả trước");
    expect(fundingSourceLabel(null)).toBe("—");
  });
});

describe("batchStatusTone", () => {
  it("gives each batch status one colour for the list and the detail", () => {
    expect(batchStatusTone("DRAFT")).toBe("warning");
    expect(batchStatusTone("SUBMITTING")).toBe("info");
    expect(batchStatusTone("COMPLETED")).toBe("success");
    expect(batchStatusTone("EXPIRED")).toBe("neutral");
    expect(batchStatusTone("NEW_ONE")).toBe("info");
  });
});

describe("batchProgress", () => {
  const counts = { PENDING_APPROVAL: 1, APPROVED_AWAITING_DISPATCH: 0, PROCESSING: 2, UNKNOWN: 1, SUCCEEDED: 4, FAILED: 1, CANCELLED: 1 };

  it("batchProgressFromSummary", () => {
    const progress = batchProgress({ batchId: "b", orderCount: 10, countsByStatus: counts, totalAmount: 10_000_000, succeededAmount: 4_000_000 });
    // Kết thúc = Thành công + Thất bại + Đã hủy; các trạng thái còn lại là chưa xong.
    expect(progress.finished).toBe(6);
    expect(progress.total).toBe(10);
    expect(progress.percent).toBe(60);
    expect(progress.rows.map((row) => row.status)).toEqual([...DISBURSEMENT_STATUSES]);
    expect(progress.rows.find((row) => row.status === "SUCCEEDED")?.count).toBe(4);
  });

  it("treats a missing status key as zero and an empty batch as 0%", () => {
    const empty = batchProgress({ batchId: "b", orderCount: 0, countsByStatus: {}, totalAmount: 0, succeededAmount: 0 });
    expect(empty.percent).toBe(0);
    expect(empty.rows.every((row) => row.count === 0)).toBe(true);
  });
});
