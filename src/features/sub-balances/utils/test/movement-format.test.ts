import { describe, expect, it } from "vitest";
import { exportRangeError, formatBalance, balanceToneClass, MOVEMENT_TYPE_LABELS } from "../movement-format";
import { movementBusinessHref } from "../movement-range";

describe("formatBalance", () => {
  it("negativeBalanceRenderedWithMinus: a real minus sign (U+2212), never a hyphen", () => {
    expect(formatBalance(-300_000)).toBe("−300.000 vnđ");
    expect(formatBalance(8_714_500)).toBe("8.714.500 vnđ");
    expect(formatBalance(0)).toBe("0 vnđ");
  });

  it("only a negative balance is red", () => {
    expect(balanceToneClass(-1)).toBe("text-danger");
    expect(balanceToneClass(0)).toBe("text-muted-foreground");
    expect(balanceToneClass(5)).toBe("text-muted-foreground");
  });
});

describe("MOVEMENT_TYPE_LABELS", () => {
  it("names the chi hộ chips in Vietnamese", () => {
    expect(MOVEMENT_TYPE_LABELS.DISBURSEMENT).toBe("Chi hộ");
    expect(MOVEMENT_TYPE_LABELS.TOPUP).toBe("Nạp tiền");
  });
});

describe("exportRangeError", () => {
  it("needs both dates", () => {
    expect(exportRangeError(undefined, "2026-11-10")).toBe("Vui lòng chọn Từ ngày và Đến ngày để xuất file");
    expect(exportRangeError("2026-11-01", undefined)).toBe("Vui lòng chọn Từ ngày và Đến ngày để xuất file");
  });

  it("refuses an inverted range", () => {
    expect(exportRangeError("2026-11-10", "2026-11-01")).toBe("Từ ngày không được sau Đến ngày");
  });

  it("counts both end days: 93 days pass (01/08–01/11), 94 do not", () => {
    expect(exportRangeError("2026-08-01", "2026-11-01")).toBeNull();
    expect(exportRangeError("2026-07-31", "2026-11-01")).toBe("Khoảng thời gian xuất tối đa 93 ngày");
    expect(exportRangeError("2026-11-10", "2026-11-10")).toBeNull();
  });
});

describe("movementBusinessHref (chi hộ)", () => {
  const sub = "11111111-1111-4111-8111-111111111111";
  it("opens the disbursement order detail by operation id, hides the button without one", () => {
    expect(movementBusinessHref({ type: "DISBURSEMENT", id: "op-1", code: "YC1" }, sub)).toBe("/disbursements/orders/op-1");
    expect(movementBusinessHref({ type: "DISBURSEMENT", id: null, code: "YC1" }, sub)).toBeNull();
  });
});
