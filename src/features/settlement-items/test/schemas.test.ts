import { describe, expect, it } from "vitest";
import { settlementItemDetailSchema, settlementItemSchema, settlementTotalsSchema } from "../schemas";
import { detailFixture, detailWithTerminalFixture, rowFixture, subId, totalsFixture } from "./fixtures";

describe("settlement item schemas", () => {
  it("parses a row and the totals", () => {
    expect(settlementItemSchema.parse(rowFixture).orderCode).toBe("MO20261013000123");
    expect(settlementTotalsSchema.parse(totalsFixture).count).toBe(128);
  });

  it("accepts a row without a hold tranche", () => {
    const parsed = settlementItemSchema.parse({ ...rowFixture, heldAmount: 0, holdTrancheStatus: null });
    expect(parsed.holdTrancheStatus).toBeNull();
  });

  it("drops the internal fee and hold snapshots so they never reach the browser", () => {
    const parsed = settlementItemDetailSchema.parse(detailFixture) as Record<string, unknown>;
    expect(parsed.lines).toHaveLength(4);
    expect(parsed).not.toHaveProperty("feeQuoteSnapshot");
    expect(parsed).not.toHaveProperty("holdRuleSnapshot");
    expect(parsed).not.toHaveProperty("lotId");
  });

  it("rejects an unknown line status", () => {
    const broken = { ...detailFixture, lines: [{ ...detailFixture.lines[0], status: "LOST" }] };
    expect(settlementItemDetailSchema.safeParse(broken).success).toBe(false);
  });

  // Mục 12: BE chi tiết không gửi 4 trường trạng thái/lệnh rút của dòng danh sách; schema cũ kế thừa nên safeParse hỏng
  // → INVALID_RESPONSE → "Hệ thống đang gặp sự cố".
  it("parses the detail exactly as the BE sends it, without the list-only tranche fields", () => {
    const result = settlementItemDetailSchema.safeParse(detailFixture);
    expect(result.success).toBe(true);
  });

  it("accepts a detail with no hold release date and with freeze lines", () => {
    const freezeLine = { id: "l5", kind: "FREEZE", amount: -1_000, status: "HELD", withdrawalRequestId: null, updatedAt: null };
    const result = settlementItemDetailSchema.safeParse({ ...detailFixture, holdReleaseAt: null, lines: [...detailFixture.lines, freezeLine] });
    expect(result.success).toBe(true);
  });

  it("keeps the Sub, transaction code and terminal of the detail", () => {
    const parsed = settlementItemDetailSchema.parse(detailWithTerminalFixture);
    expect(parsed).toMatchObject({ subMerchantName: "Halo tech", transactionCode: "FM26ABCDE", terminalCode: "T0001", terminalType: "QR" });
  });

  it("parses the totals with the split by Sub and by tranche status", () => {
    const parsed = settlementTotalsSchema.parse({
      ...totalsFixture,
      bySub: [{ subMerchantId: subId, subMerchantCode: "S001", subMerchantName: "Halo tech", count: 1, grossAmount: 1, feeAmount: 0, recognisedAmount: 1, firstTrancheAmount: 1, heldAmount: 0 }],
      byTrancheStatus: { READY: 1 },
    });
    expect(parsed.bySub).toHaveLength(1);
    expect(parsed.byTrancheStatus).toEqual({ READY: 1 });
    // Bản BE chưa có hai trường này vẫn đọc được.
    expect(settlementTotalsSchema.parse(totalsFixture)).toMatchObject({ bySub: [], byTrancheStatus: {} });
  });
});
