import { describe, expect, it } from "vitest";
import { transactionSchema } from "../transaction.schema";
import { BE_TRANSACTION } from "../../test/transaction.fixtures";

describe("transaction BE contract", () => {
  it("parses a MerchantTransactionResponse row of flex.merchant", () => {
    expect(transactionSchema.parse(BE_TRANSACTION)).toMatchObject({
      transactionCode: "FM26NEFQ9",
      orderCode: "DH261102-2208",
      status: "SUCCESS",
    });
  });

  it("accepts the nulls the BE sends for an order without Sub, Terminal or fee", () => {
    const bare = {
      ...BE_TRANSACTION,
      transactionCode: null,
      subMerchantId: null,
      subMerchantCode: null,
      subMerchantName: null,
      feeAmount: null,
      payableAmount: null,
      feeBearer: null,
    };
    expect(transactionSchema.parse(bare).subMerchantId).toBeNull();
  });
});
