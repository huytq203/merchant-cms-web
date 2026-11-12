import { describe, expect, it } from "vitest";
import { customerDisplaySchema, customerDisplayStatusSchema, withKind } from "../schemas";

// Mẫu lấy đúng theo `CustomerDisplayContracts` của flex.merchant (bàn giao 12/11/2026).
const orderResponse = {
  displayToken: "djF8T3w.sig",
  tokenExpiresAt: "2026-11-12T03:45:00Z",
  orderId: "33333333-3333-4333-8333-333333333333",
  orderCode: "DH-001",
  qrPayload: "000201010212",
  shop: { merchantName: "Công ty Halo", subMerchantCode: "HALO-S1", subMerchantName: "Halo Cầu Giấy", terminalName: "Quầy 1" },
  amount: 100000,
  fee: 2000,
  feeBearer: "MERCHANT",
  payableAmount: 100000,
  expiresAt: "2026-11-12T10:30:00",
};
const staticResponse = {
  displayToken: "t",
  tokenExpiresAt: "2026-11-12T15:00:00Z",
  staticQrId: "88888888-8888-4888-8888-888888888888",
  code: "SQABCDEFGH23",
  qrPayload: "000201010211",
  shop: { merchantName: "Công ty Halo", subMerchantCode: null, subMerchantName: null, terminalName: null },
};

describe("customerDisplaySchema", () => {
  it("reads the BE order response and names the shop after the Sub", () => {
    const parsed = customerDisplaySchema.parse(orderResponse);
    expect(parsed.shop).toEqual({ name: "Halo Cầu Giấy", terminalName: "Quầy 1" });
    expect(parsed).toMatchObject({ feeBearer: "MERCHANT", payableAmount: 100000, displayCode: "DH-001" });
  });

  it("reads the BE static response and falls back to the Master name", () => {
    const parsed = customerDisplaySchema.parse(staticResponse);
    expect(parsed.shop.name).toBe("Công ty Halo");
    expect(parsed.displayCode).toBe("SQABCDEFGH23");
  });

  it("keeps the BE kind and only infers it when missing", () => {
    expect(withKind(customerDisplaySchema.parse(staticResponse), "STATIC_QR").kind).toBe("STATIC_QR");
    expect(withKind(customerDisplaySchema.parse({ ...orderResponse, kind: "ORDER" }), "STATIC_QR").kind).toBe("ORDER");
  });

  it("accepts a status without the null fields BE leaves out", () => {
    expect(customerDisplayStatusSchema.parse({ status: "WAITING" })).toEqual({ status: "WAITING" });
  });
});
