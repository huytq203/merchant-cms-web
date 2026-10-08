import { describe, expect, it } from "vitest";
import { refundSchema } from "@/features/refund/schemas/Refund.schema";
import { REFUND_FIXTURES } from "../refund.fixtures";

describe("refund fixtures", () => {
  it("all parse with the module schema and have unique ids", () => {
    for (const row of REFUND_FIXTURES) {
      expect(refundSchema.safeParse(row).success).toBe(true);
    }
    expect(new Set(REFUND_FIXTURES.map((row) => row.id)).size).toBe(REFUND_FIXTURES.length);
  });

  it("only carry the allowed keys", () => {
    const allowed = Object.keys(refundSchema.shape).sort();
    for (const row of REFUND_FIXTURES) {
      expect(Object.keys(row).sort()).toEqual(allowed);
    }
  });

  it("contain no real personal data: placeholder names, masked cards, no emails", () => {
    for (const row of REFUND_FIXTURES) {
      expect(row.recipientName).toMatch(/^Người nhận mẫu \d+$/);
      expect(row.subMerchantName).toMatch(/^Cửa hàng mẫu [A-Z]$/);
      expect(row.createdBy ?? "").toMatch(/^(Nhân viên mẫu \d+)?$/);
      expect(row.recipientCard ?? "****").toMatch(/^(\*{4} ){3}\d{4}$|^\*{4}$/);
      expect(JSON.stringify(row)).not.toMatch(/@/);
    }
  });

  it("covers every status so the UI can show each one", () => {
    const statuses = new Set(REFUND_FIXTURES.map((row) => row.status));
    expect([...statuses].sort()).toEqual(["approved", "cancelled", "pending", "rejected", "success"]);
  });
});
