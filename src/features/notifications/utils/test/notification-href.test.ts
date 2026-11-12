import { describe, expect, it } from "vitest";
import { notificationHref } from "../notification-href";

const ID = "33333333-3333-4333-8333-333333333333";
const SUB = "44444444-4444-4444-8444-444444444444";
const href = (targetType: string | null, targetId: string | null = ID, subMerchantId: string | null = null) =>
  notificationHref({ targetType, targetId, subMerchantId });

describe("notificationHref", () => {
  it.each([
    ["ORDER", `/order?detail=${ID}`],
    ["WITHDRAWAL", `/withdrawal?detail=${ID}`],
    ["REFUND", `/revenue-refunds?detail=${ID}`],
    ["COMPLAINT", `/complaint?detail=${ID}`],
    ["BANK_ACCOUNT", `/bank-accounts?detail=${ID}`],
    ["SUB_MERCHANT", `/sub-merchants?detail=${ID}`],
    ["USER", `/users?detail=${ID}`],
  ])("opens the detail of a %s", (type, expected) => {
    expect(href(type)).toBe(expected);
  });

  it.each([
    ["ESCROW", "/escrow"],
    ["SUB_BALANCE", "/sub-balances"],
    ["WITHDRAWAL_LIST", "/withdrawal"],
  ])("opens the list page for %s, with or without an id", (type, expected) => {
    expect(href(type)).toBe(expected);
    expect(href(type, null)).toBe(expected);
  });

  it("filters the freeze list by the sub-merchant of the notification", () => {
    expect(href("FREEZE_LIST", null, SUB)).toBe(`/revenue-freezes?subMerchantId=${SUB}`);
    expect(href("FREEZE_LIST", null, null)).toBe("/revenue-freezes");
  });

  it("has no destination for NONE, a missing type or a type it does not know", () => {
    expect(href("NONE")).toBeNull();
    expect(href(null)).toBeNull();
    expect(href("SOMETHING_NEW")).toBeNull();
  });

  it("falls back to the bare list page for an id-based type without an id, like the BE", () => {
    const lists: Record<string, string> = {
      ORDER: "/order",
      WITHDRAWAL: "/withdrawal",
      REFUND: "/revenue-refunds",
      COMPLAINT: "/complaint",
      BANK_ACCOUNT: "/bank-accounts",
      SUB_MERCHANT: "/sub-merchants",
      USER: "/users",
    };
    for (const [type, path] of Object.entries(lists)) {
      expect(href(type, null)).toBe(path);
      expect(href(type, "")).toBe(path);
    }
  });
});
