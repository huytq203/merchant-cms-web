import { describe, expect, it } from "vitest";
import { transactionSchema, transactionStatusSchema } from "./transaction.schema";
import { TRANSACTION_FIXTURES } from "@/server/modules/transactions/transaction.fixtures";

describe("transaction fixture contract", () => {
  it("supports every new status and a transaction type with invoice code", () => {
    for (const status of ["review", "cancelled", "created", "expired"]) {
      expect(transactionStatusSchema.parse(status)).toBe(status);
    }
    expect(transactionSchema.parse(TRANSACTION_FIXTURES[0])).toHaveProperty("type");
    expect(transactionSchema.parse(TRANSACTION_FIXTURES[0])).toHaveProperty("invoiceCode");
  });
});
