import { describe, expect, it } from "vitest";
import { transactionSchema } from "@/features/transactions/schemas/transaction.schema";
import { TRANSACTION_FIXTURES } from "./transaction.fixtures";

describe("transaction fixtures", () => {
  it("all parse with the module schema and have unique ids", () => {
    for (const row of TRANSACTION_FIXTURES) {
      expect(transactionSchema.safeParse(row).success).toBe(true);
    }
    expect(new Set(TRANSACTION_FIXTURES.map((row) => row.id)).size).toBe(TRANSACTION_FIXTURES.length);
  });

  it("only carry the allowed keys", () => {
    const allowed = Object.keys(transactionSchema.shape).sort();
    for (const row of TRANSACTION_FIXTURES) {
      expect(Object.keys(row).sort()).toEqual(allowed);
    }
  });

  it("contain no real personal data: placeholder names, reserved phones, masked cards", () => {
    for (const row of TRANSACTION_FIXTURES) {
      expect(row.customerName).toMatch(/^Khách hàng mẫu \d+$/);
      expect(row.subMerchantName).toMatch(/^Cửa hàng mẫu [A-Z]$/);
      expect(row.customerPhone).toMatch(/^0900000\d{3}$/);
      expect(row.cardNumber).toMatch(/^(\*{4} ){3}\d{4}$/);
      expect(JSON.stringify(row)).not.toMatch(/@/);
    }
  });

  it("covers every status so the UI can show each one", () => {
    const statuses = new Set(TRANSACTION_FIXTURES.map((row) => row.status));
    expect([...statuses].sort()).toEqual(["cancelled", "created", "expired", "failed", "pending", "refunded", "review", "success"]);
  });
});
