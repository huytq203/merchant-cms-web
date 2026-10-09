import { describe, expect, it } from "vitest";
import { orderStatusSchema } from "../../schemas/order.schema";
import { ORDER_STEPS, orderNote, orderStepStates } from "../order-timeline";

describe("order progress", () => {
  it("marks earlier steps done and the current one active while waiting for payment", () => {
    expect(orderStepStates("ACTIVE")).toEqual(["done", "current", "upcoming", "upcoming", "upcoming"]);
  });

  it("completes every step once the order succeeded", () => {
    expect(orderStepStates("SUCCESS")).toEqual(Array(ORDER_STEPS.length).fill("done"));
  });

  it("flags the step an order got stuck or failed on", () => {
    expect(orderStepStates("CREDIT_RECONCILIATION_REQUIRED")).toEqual(["done", "done", "done", "failed", "upcoming"]);
    expect(orderStepStates("FAILED")[1]).toBe("failed");
  });

  it("covers every status BE can send", () => {
    for (const status of orderStatusSchema.options) {
      expect(orderStepStates(status)).toHaveLength(ORDER_STEPS.length);
      expect(orderNote(status, false).text).not.toBe("");
    }
  });
});

describe("order note", () => {
  it("tells the merchant to refresh only when the QR of an unpaid order has expired", () => {
    expect(orderNote("ACTIVE", true).tone).toBe("warning");
    expect(orderNote("ACTIVE", false).tone).toBe("info");
  });

  it("does not ask the merchant to act on a reconciliation", () => {
    expect(orderNote("CREDIT_RECONCILIATION_REQUIRED", false).text).toMatch(/không cần làm gì/);
  });
});
