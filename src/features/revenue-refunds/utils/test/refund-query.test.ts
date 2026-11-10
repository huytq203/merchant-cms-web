import { describe, expect, it } from "vitest";
import { parseRefundSearchParams } from "../../revenue-refund-queries";
import { refundFilterToSearch, refundPeriodToDates, refundQueryString, toRefundQuery } from "../refund-query";

const today = "2026-11-10";

describe("refundPeriodToDates", () => {
  it("defaults to the 7 calendar days ending today, and 30 days when asked", () => {
    expect(refundPeriodToDates({}, today)).toEqual({ from: "2026-11-04", to: today });
    expect(refundPeriodToDates({ period: "30d" }, today)).toEqual({ from: "2026-10-12", to: today });
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
    expect(toRefundQuery({ group: "FAILED" }, today).statuses).toBe("REJECTED,FAILED,CANCELLED");
    expect(toRefundQuery({ group: "PENDING", status: "SUCCEEDED" }, today).statuses).toBe("PENDING_APPROVAL,SUCCEEDED");
    expect(toRefundQuery({}, today).statuses).toBeUndefined();
  });

  it("carries the search code, the Sub and the order, and drops empty fields from the query string", () => {
    const query = toRefundQuery({ q: "FM26K3QZP", subMerchantId: "aaaaaaaa-0000-4000-8000-0000000000b2" }, today);
    expect(query).toMatchObject({ q: "FM26K3QZP", subMerchantId: "aaaaaaaa-0000-4000-8000-0000000000b2", from: "2026-11-04", to: today });
    expect(refundQueryString({ q: "", from: "2026-11-04" })).toBe("from=2026-11-04");
    expect(refundQueryString(query, ["statuses", "from", "to"])).toBe("q=FM26K3QZP&subMerchantId=aaaaaaaa-0000-4000-8000-0000000000b2");
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
