/** A BE sub balance report shared by this feature's tests. */
const bucket = (code: string, amount: number) => ({ code, label: code, amount, explanation: "Giải thích" });
export const reportFixture = {
  subMerchantId: "11111111-1111-4111-8111-111111111111",
  subCode: "SUB001",
  subName: "Cửa hàng A",
  revenueBalance: 9_000_000,
  availableBalance: 5_000_000,
  pendingSettlement: 2_000_000,
  frozenTotal: 2_000_000,
  available: bucket("AVAILABLE", 5_000_000),
  pending: bucket("PENDING_SETTLEMENT", 2_000_000),
  ruleHold: bucket("RULE_HOLD", 1_200_000),
  orderFreeze: bucket("ORDER_FREEZE", 0),
  withdrawalInProcess: bucket("WITHDRAWAL_IN_PROCESS", 500_000),
  waitingEscrow: bucket("WAITING_ESCROW", 300_000),
  asOf: "2026-10-13T03:00:00Z",
};
