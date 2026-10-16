/** BE settlement items shared by this feature's tests. */
export const subId = "11111111-1111-4111-8111-111111111111";
export const itemId = "44444444-4444-4444-8444-444444444444";

export const rowFixture = {
  id: itemId,
  orderId: "55555555-5555-4555-8555-555555555555",
  orderCode: "MO20261013000123",
  subMerchantId: subId,
  paidAt: "2026-10-13T02:00:00Z",
  grossAmount: 100_000,
  feeAmount: 1_100,
  recognisedAmount: 98_900,
  firstTrancheAmount: 88_900,
  heldAmount: 10_000,
  firstTrancheStatus: "PENDING_SETTLEMENT",
  firstTrancheWithdrawalId: null,
  holdTrancheStatus: "HELD",
  holdTrancheWithdrawalId: null,
  holdReleaseAt: "2026-10-20T02:00:00Z",
};

export const totalsFixture = {
  count: 128,
  grossAmount: 12_800_000,
  feeAmount: 140_800,
  recognisedAmount: 12_659_200,
  firstTrancheAmount: 11_393_280,
  heldAmount: 1_265_920,
};

export const detailFixture = {
  ...rowFixture,
  masterId: "66666666-6666-4666-8666-666666666666",
  lotId: "lot-1",
  tnEligibleAt: "2026-10-14T02:00:00Z",
  feeQuoteSnapshot: { internalRate: 0.011 },
  holdRuleSnapshot: { rule: "secret" },
  lines: [
    { id: "l1", kind: "FIRST_TRANCHE", amount: 88_900, status: "PAID", withdrawalRequestId: "77777777-7777-4777-8777-777777777777", updatedAt: "2026-10-14T03:00:00Z" },
    { id: "l2", kind: "HOLD_TRANCHE", amount: 10_000, status: "CANCELLED", withdrawalRequestId: null, updatedAt: "2026-10-15T03:00:00Z" },
    { id: "l3", kind: "REFUND", amount: -88_900, status: "READY", withdrawalRequestId: null, updatedAt: "2026-10-15T03:00:00Z" },
    { id: "l4", kind: "FEE_REFUND", amount: 1_100, status: "READY", withdrawalRequestId: null, updatedAt: "2026-10-15T03:00:00Z" },
  ],
  grossEqualsFeePlusRecognised: true,
  recognisedEqualsTranches: true,
  singleItemForPayment: true,
};
