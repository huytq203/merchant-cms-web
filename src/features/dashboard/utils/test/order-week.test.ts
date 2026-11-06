import { describe, expect, it } from "vitest";

import { bucketOf, lastDays, summarizeWeek, vnDay } from "../order-week";

const row = (status: Parameters<typeof bucketOf>[0], createdAt: string, amount = 1000) => ({ status, createdAt, amount });

describe("vnDay", () => {
  it("reads the calendar day in Vietnam, not UTC", () => {
    expect(vnDay("2026-10-11T18:30:00Z")).toBe("2026-10-12");
    expect(vnDay("2026-10-12T16:59:00Z")).toBe("2026-10-12");
  });

  it("returns null for a missing or invalid time", () => {
    expect(vnDay(null)).toBeNull();
    expect(vnDay("not a date")).toBeNull();
  });
});

describe("lastDays", () => {
  it("lists the days oldest first and ends on the given day", () => {
    expect(lastDays("2026-10-12", 3)).toEqual(["2026-10-10", "2026-10-11", "2026-10-12"]);
  });

  it("crosses a month boundary", () => {
    expect(lastDays("2026-11-01", 2)).toEqual(["2026-10-31", "2026-11-01"]);
  });
});

describe("bucketOf", () => {
  it("groups the ten order statuses into four buckets", () => {
    expect(["SUCCESS", "PAYMENT_CONFIRMED", "CREDIT_PENDING", "CREDIT_POSTING"].map((s) => bucketOf(s as never))).toEqual(["paid", "paid", "paid", "paid"]);
    expect(["PENDING", "ACTIVE"].map((s) => bucketOf(s as never))).toEqual(["waiting", "waiting"]);
    expect(bucketOf("FAILED")).toBe("failed");
    expect(["EXPIRED", "CANCELLED"].map((s) => bucketOf(s as never))).toEqual(["closed", "closed"]);
  });
});

describe("bucketOf with the transitional alias", () => {
  it("counts the retired CREDIT_RECONCILIATION_REQUIRED as processing (paid), never as failed", () => {
    expect(bucketOf("CREDIT_RECONCILIATION_REQUIRED" as never)).toBe("paid");
  });
});

describe("summarizeWeek", () => {
  const days = lastDays("2026-10-12", 7);

  it("counts every day, including days without orders", () => {
    const week = summarizeWeek([row("SUCCESS", "2026-10-12T03:00:00Z")], days);
    expect(week.days).toHaveLength(7);
    expect(week.days[6]).toMatchObject({ day: "2026-10-12", label: "T2 12/10", paid: 1, waiting: 0 });
    expect(week.days[0]).toMatchObject({ paid: 0, waiting: 0, failed: 0, closed: 0 });
  });

  it("sums revenue from paid orders only", () => {
    const week = summarizeWeek(
      [row("SUCCESS", "2026-10-12T03:00:00Z", 2000), row("PAYMENT_CONFIRMED", "2026-10-11T03:00:00Z", 500), row("ACTIVE", "2026-10-12T03:00:00Z", 9999), row("EXPIRED", "2026-10-12T03:00:00Z", 7777)],
      days,
    );
    expect(week.revenue).toBe(2500);
    expect(week.totals).toEqual({ paid: 2, waiting: 1, failed: 0, closed: 1 });
    expect(week.count).toBe(4);
  });

  it("ignores orders outside the window or without a creation time", () => {
    const week = summarizeWeek([row("SUCCESS", "2026-09-01T03:00:00Z"), row("SUCCESS", null as never)], days);
    expect(week.count).toBe(0);
    expect(week.revenue).toBe(0);
  });
});
