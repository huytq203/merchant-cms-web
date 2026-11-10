import { describe, expect, it } from "vitest";
import { movementBusinessHref, movementRangeToDates } from "../movement-range";

describe("movementRangeToDates", () => {
  const today = "2026-11-10";

  it("7 days means today and the 6 days before it, in Vietnam calendar days", () => {
    expect(movementRangeToDates("7d", today)).toEqual({ fromDate: "2026-11-04", toDate: "2026-11-10" });
  });

  it("30 days crosses the month boundary", () => {
    expect(movementRangeToDates("30d", today)).toEqual({ fromDate: "2026-10-12", toDate: "2026-11-10" });
  });

  it("90 days is today and the 89 days before it", () => {
    expect(movementRangeToDates("90d", today)).toEqual({ fromDate: "2026-08-13", toDate: "2026-11-10" });
  });

  it("custom range passes the chosen dates and leaves an empty side open", () => {
    expect(movementRangeToDates("custom", today, { from: "2026-11-01", to: "" })).toEqual({ fromDate: "2026-11-01", toDate: undefined });
  });
});

describe("movementBusinessHref", () => {
  const sub = "11111111-1111-4111-8111-111111111111";

  it("is null without a link", () => {
    expect(movementBusinessHref(null, sub)).toBeNull();
  });

  it("opens the order list filtered by the order code", () => {
    expect(movementBusinessHref({ type: "ORDER", code: "DH26 1" }, sub)).toBe("/order?orderCode=DH26+1");
    expect(movementBusinessHref({ type: "ORDER", code: null }, sub)).toBe("/order");
  });

  it("maps the other types to the pages that exist", () => {
    expect(movementBusinessHref({ type: "WITHDRAWAL" }, sub)).toBe("/withdrawal");
    expect(movementBusinessHref({ type: "REFUND" }, sub)).toBe("/revenue-refunds");
    expect(movementBusinessHref({ type: "FREEZE" }, sub)).toBe(`/revenue-freezes?subMerchantId=${sub}`);
    expect(movementBusinessHref({ type: "ESCROW" }, sub)).toBe("/escrow");
    // Hoàn trả ký quỹ về doanh thu Sub cũng mở trang ký quỹ (trang chưa có màn chi tiết theo mã hoàn trả).
    expect(movementBusinessHref({ type: "ESCROW_RETURN", code: "HT-KQ-1" }, sub)).toBe("/escrow");
  });

  it("hides the button for a type with no page", () => {
    expect(movementBusinessHref({ type: "OTHER" }, sub)).toBeNull();
  });
});
