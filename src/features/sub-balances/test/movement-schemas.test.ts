import { describe, expect, it } from "vitest";
import { movementDetailSchema, movementFilterSchema, movementSchema } from "../movement-schemas";
import { movementQueries } from "../movement-queries";
import { SUB_ID, OP_ORDER, orderDetail, orderMovement } from "./movement-fixtures";

/** Dòng chi hộ / nạp như BE Task 7.9 trả cho ngăn OTHER (mã YC Merchant làm reference, dư nợ Trả sau kèm theo). */
const disbursementRow = {
  ...orderMovement, id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1", type: "DISBURSEMENT", kind: "DISBURSEMENT", label: "Chi hộ",
  reference: "YC2611190001", amount: -500_000, balanceAfter: -300_000, pocket: "OTHER", overdraftDelta: 300_000, overdraftAfter: 300_000,
};
const topupRow = { ...disbursementRow, id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2", type: "TOPUP", kind: "TOPUP_DISBURSEMENT", label: "Nạp để chi hộ", amount: 500_000 };

describe("movementSchema (chi hộ)", () => {
  it("parsesDisbursementAndTopupKinds", () => {
    expect(movementSchema.parse(disbursementRow).type).toBe("DISBURSEMENT");
    expect(movementSchema.parse(topupRow).type).toBe("TOPUP");
    expect(movementSchema.parse(disbursementRow)).toMatchObject({ pocket: "OTHER", overdraftDelta: 300_000, overdraftAfter: 300_000 });
  });

  it("parsesNegativeBalanceAfter", () => {
    expect(movementSchema.parse(disbursementRow).balanceAfter).toBe(-300_000);
  });

  it("legacyResponseWithoutPocketParses", () => {
    const parsed = movementSchema.parse(orderMovement);
    expect(parsed.pocket ?? null).toBeNull();
    expect(parsed.overdraftDelta ?? null).toBeNull();
    expect(movementDetailSchema.parse(orderDetail).lines).toHaveLength(5);
  });

  it("unknownKindFallsBackToOther", () => {
    // Kiểu mới của BE chưa biết ở FE không được làm vỡ cả trang biến động.
    expect(movementSchema.parse({ ...orderMovement, type: "SOMETHING_NEW" }).type).toBe("OTHER");
  });
});

describe("movementFilterSchema (ngăn và chip chi hộ)", () => {
  it("accepts WALLET and OTHER and the new chips, rejects an unknown pocket in Vietnamese", () => {
    expect(movementFilterSchema.parse({ pocket: "OTHER", type: "DISBURSEMENT" })).toMatchObject({ pocket: "OTHER", type: "DISBURSEMENT" });
    expect(movementFilterSchema.parse({ type: "TOPUP" }).type).toBe("TOPUP");
    expect(movementFilterSchema.parse({}).pocket).toBeUndefined();
    const bad = movementFilterSchema.safeParse({ pocket: "ALL" });
    expect(bad.success).toBe(false);
    expect(!bad.success && bad.error.issues[0]?.message).toMatch(/Nguồn số dư không hợp lệ/);
  });
});

describe("movementQueries", () => {
  it("queryKeyIncludesPocket", () => {
    const all = movementQueries.list(SUB_ID, { type: "ALL" }).queryKey;
    const other = movementQueries.list(SUB_ID, { type: "ALL", pocket: "OTHER" }).queryKey;
    const wallet = movementQueries.list(SUB_ID, { type: "ALL", pocket: "WALLET" }).queryKey;
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(all));
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(wallet));
    // Chi tiết cũng theo ngăn: cùng operation nhưng số tiền/số dư hiển thị khác nhau giữa các ngăn.
    expect(JSON.stringify(movementQueries.detail(SUB_ID, OP_ORDER, "OTHER").queryKey))
      .not.toBe(JSON.stringify(movementQueries.detail(SUB_ID, OP_ORDER).queryKey));
  });
});
