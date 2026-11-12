import { describe, expect, it } from "vitest";
import { parseRefundSearchParams } from "../../revenue-refund-queries";
import { canCancelRefund, refundFilterToSearch, refundPeriodToDates, refundQueryString, toRefundQuery } from "../refund-query";

const today = "2026-11-10";

describe("refundPeriodToDates", () => {
  it("defaults to the 7 calendar days ending today, and 30 days when asked", () => {
    expect(refundPeriodToDates({}, today)).toEqual({ from: "2026-11-04", to: today });
    expect(refundPeriodToDates({ period: "30d" }, today)).toEqual({ from: "2026-10-12", to: today });
  });

  it("does not limit the dates of a link that names an order unless a period is written in the URL", () => {
    expect(refundPeriodToDates({ orderId: "7c1f2a3e-1111-4222-8333-444455556666" }, today)).toEqual({});
    expect(refundPeriodToDates({ orderId: "7c1f2a3e-1111-4222-8333-444455556666", period: "30d" }, today)).toEqual({ from: "2026-10-12", to: today });
  });

  it("uses the typed dates for a custom period and leaves an empty side open", () => {
    expect(refundPeriodToDates({ period: "custom", from: "2026-10-01", to: "2026-10-31" }, today)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(refundPeriodToDates({ period: "custom", from: "2026-10-01" }, today)).toEqual({ from: "2026-10-01" });
    expect(refundPeriodToDates({ period: "custom" }, today)).toEqual({});
  });
});

describe("toRefundQuery", () => {
  it("turns the status group and a single status into one comma list", () => {
    expect(toRefundQuery({ group: "PROCESSING" }, today).statuses).toBe("PROCESSING,ACCOUNTING_QUEUE");
    expect(toRefundQuery({ group: "FAILED" }, today).statuses).toBe("REJECTED,FAILED");
    expect(toRefundQuery({ group: "CANCELLED" }, today).statuses).toBe("CANCELLED");
    expect(toRefundQuery({ group: "PENDING", status: "SUCCEEDED" }, today).statuses).toBe("PENDING_APPROVAL,SUCCEEDED");
    expect(toRefundQuery({}, today).statuses).toBeUndefined();
  });

  it("carries the search code, the Sub and the order, and drops empty fields from the query string", () => {
    const query = toRefundQuery({ q: "FM26K3QZP", subMerchantIds: ["aaaaaaaa-0000-4000-8000-0000000000b2", "aaaaaaaa-0000-4000-8000-0000000000b3"] }, today);
    expect(query).toMatchObject({ q: "FM26K3QZP", subMerchantIds: "aaaaaaaa-0000-4000-8000-0000000000b2,aaaaaaaa-0000-4000-8000-0000000000b3", from: "2026-11-04", to: today });
    expect(refundQueryString({ q: "", from: "2026-11-04" })).toBe("from=2026-11-04");
    expect(refundQueryString(query, ["statuses", "from", "to"])).toBe("q=FM26K3QZP&subMerchantIds=aaaaaaaa-0000-4000-8000-0000000000b2%2Caaaaaaaa-0000-4000-8000-0000000000b3");
  });
});

describe("page URL", () => {
  it("round-trips the filter and keeps the default period out of the URL", () => {
    expect(refundFilterToSearch({ period: "7d" })).toBe("");
    expect(refundFilterToSearch({ q: "DH26", group: "SUCCEEDED", period: "30d" })).toBe("q=DH26&group=SUCCEEDED&period=30d");
    expect(refundFilterToSearch({ period: "custom", from: "2026-10-01", to: "2026-10-31" })).toBe("period=custom&from=2026-10-01&to=2026-10-31");
    expect(parseRefundSearchParams({ group: "FAILED", period: "custom", from: "2026-10-01", q: "x" }))
      .toEqual({ group: "FAILED", period: "custom", from: "2026-10-01", q: "x" });
  });

  it("ignores values it does not know instead of breaking the page", () => {
    expect(parseRefundSearchParams({ group: "NOPE", period: "1y", status: "WHATEVER" })).toEqual({});
  });
});

describe("canCancelRefund (cùng quy tắc MerchantRevenueRefundService.cancel)", () => {
  const creatorOnly = { canCancelAny: false, canCreate: true, userId: "u1" };
  const canCancelAny = { canCancelAny: true, canCreate: false, userId: "u2" };

  it("người chỉ có CREATE_REFUND chỉ hủy được yêu cầu của chính mình", () => {
    expect(canCancelRefund({ createdSource: "PORTAL", createdBy: "u1" }, creatorOnly)).toBe(true);
    expect(canCancelRefund({ createdSource: "PORTAL", createdBy: "u9" }, creatorOnly)).toBe(false);
  });

  it("CANCEL_REFUND/APPROVE_REFUND hủy được yêu cầu của người khác", () => {
    expect(canCancelRefund({ createdSource: "PORTAL", createdBy: "u9" }, canCancelAny)).toBe(true);
  });

  it("chỉ yêu cầu do Portal tạo: Admin tạo hoặc thiếu nguồn tạo thì BE từ chối nên không hiện nút", () => {
    expect(canCancelRefund({ createdSource: "ADMIN", createdBy: "u1" }, canCancelAny)).toBe(false);
    expect(canCancelRefund({ createdSource: null, createdBy: "u1" }, creatorOnly)).toBe(false);
    expect(canCancelRefund({ createdBy: "u1" }, canCancelAny)).toBe(false);
  });
});
