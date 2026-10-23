import { describe, expect, it } from "vitest";
import { notificationSchema, unreadCountSchema } from "../schemas";
import { parseNotificationSearchParams } from "../notification-queries";

const row = {
  id: "7d0c1f0e-3b1a-4a55-9a52-0c6d1d0b9a11",
  type: "TRANSACTION_RESULT",
  title: "Giao dịch thành công",
  body: "Đơn ORD-1 · 1.000 ₫ · Cửa hàng A",
  orderId: "0f8fad5b-d9cb-469f-a165-70867728950e",
  subMerchantId: null,
  createdAt: "2026-10-20T08:00:00Z",
  readAt: null,
};

describe("notification schema (BE contract 2026-10-23)", () => {
  it("accepts the documented row with UTC times and nullable links", () => {
    expect(notificationSchema.parse(row)).toEqual(row);
    expect(notificationSchema.parse({ ...row, orderId: null, readAt: "2026-10-20T09:00:00Z" }).readAt).toBe("2026-10-20T09:00:00Z");
  });

  it("keeps an unknown future type instead of failing the whole inbox", () => {
    expect(notificationSchema.parse({ ...row, type: "SETTLEMENT_DONE" }).type).toBe("SETTLEMENT_DONE");
  });

  it("rejects a row without an id or with a time that is not ISO-8601", () => {
    expect(notificationSchema.safeParse({ ...row, id: undefined }).success).toBe(false);
    expect(notificationSchema.safeParse({ ...row, createdAt: "20/10/2026" }).success).toBe(false);
  });

  it("reads the unread count as a non-negative integer", () => {
    expect(unreadCountSchema.parse({ count: 3 })).toEqual({ count: 3 });
    expect(unreadCountSchema.safeParse({ count: -1 }).success).toBe(false);
  });
});

describe("notification URL filter", () => {
  it("defaults to every notification, first page of 20", () => {
    expect(parseNotificationSearchParams({})).toEqual({ unreadOnly: false, page: 1, pageSize: 20 });
  });

  it("reads the unread filter and pagination from the URL", () => {
    expect(parseNotificationSearchParams({ unreadOnly: "true", page: "3", pageSize: "50" })).toEqual({ unreadOnly: true, page: 3, pageSize: 50 });
  });

  it("falls back on invalid pagination", () => {
    expect(parseNotificationSearchParams({ page: "-2", pageSize: "1000", unreadOnly: "yes" })).toEqual({ unreadOnly: false, page: 1, pageSize: 20 });
  });
});
