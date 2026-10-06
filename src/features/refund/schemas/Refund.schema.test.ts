import { describe, expect, it } from "vitest";
import { refundListQuerySchema, refundStatusSchema } from "./Refund.schema";

describe("refund status filters", () => {
  it("accepts cancellation and multiple statuses", () => {
    expect(refundStatusSchema.parse("cancelled")).toBe("cancelled");
    expect(refundListQuerySchema.parse({ status: "pending,cancelled" }).status).toEqual([
      "pending",
      "cancelled",
    ]);
  });
});
