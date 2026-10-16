/** BE escrow payloads shared by this feature's tests; the ledger reconciles to the standing and contributions. */
export const masterId = "aaaaaaaa-0000-4000-8000-000000000001";

export const standingFixture = {
  masterId,
  masterName: "Công ty ABC",
  state: "SHORT",
  requiredAmount: 100_000_000,
  balance: 60_000_000,
  shortfall: 40_000_000,
  surplus: 0,
  percent: 60,
  deadlineAt: "2026-11-01T17:00:00Z",
  daysLeft: 18,
  overdue: false,
  allowTransfer: true,
  allowSetoff: false,
};

export const contributionsFixture = [
  { subMerchantId: null, subCode: null, subName: null, amount: 30_000_000, byForm: { TRANSFER: 30_000_000 } },
  { subMerchantId: "bbbbbbbb-0000-4000-8000-000000000001", subCode: "SUB001", subName: "Cửa hàng A", amount: 20_000_000, byForm: { SUB_REVENUE: 20_000_000 } },
  { subMerchantId: "bbbbbbbb-0000-4000-8000-000000000002", subCode: "SUB002", subName: "Cửa hàng B", amount: 10_000_000, byForm: { SUB_REVENUE: 10_000_000 } },
];

export const ledgerFixture = [
  { seq: 5, kind: "DEPOSIT_SUB_REVENUE", amountDelta: 10_000_000, balanceAfter: 60_000_000, note: "Cửa hàng B", occurredAt: "2026-10-08T09:40:00Z" },
  { seq: 4, kind: "DEPOSIT_SUB_REVENUE", amountDelta: 20_000_000, balanceAfter: 50_000_000, note: "Cửa hàng A", occurredAt: "2026-10-02T03:02:00Z" },
  { seq: 3, kind: "RETURN", amountDelta: -15_000_000, balanceAfter: 30_000_000, note: "Giảm mức yêu cầu", occurredAt: "2026-09-25T07:30:00Z" },
  { seq: 2, kind: "DEPOSIT_TRANSFER", amountDelta: 25_000_000, balanceAfter: 45_000_000, note: null, occurredAt: "2026-09-15T02:15:00Z" },
  { seq: 1, kind: "DEPOSIT_TRANSFER", amountDelta: 20_000_000, balanceAfter: 20_000_000, note: null, occurredAt: "2026-09-01T04:11:00Z" },
];

export const ledgerPage = (content = ledgerFixture, totalElements = content.length) => ({
  content,
  totalElements,
  totalPages: Math.max(1, Math.ceil(totalElements / 20)),
  number: 0,
  size: 20,
});
