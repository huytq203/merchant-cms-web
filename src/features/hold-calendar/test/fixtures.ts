/** A BE hold calendar shared by this feature's tests: 5.000.000 held, 3.300.000 released within 30 days. */
export const subId = "11111111-1111-4111-8111-111111111111";

export const calendarFixture = {
  scope: "SUB",
  range: "DAYS_30",
  totalHeld: 5_000_000,
  releasedInPeriod: 3_300_000,
  heldAfterPeriod: 1_700_000,
  peak: { date: "2026-10-15", amount: 2_000_000 },
  days: [
    { date: "2026-10-13", weekday: "TUESDAY", count: 1, amount: 300_000, cumulativeReleased: 300_000, remainingHeld: 4_700_000, bySub: [] },
    { date: "2026-10-15", weekday: "THURSDAY", count: 4, amount: 2_000_000, cumulativeReleased: 2_300_000, remainingHeld: 2_700_000, bySub: [] },
    { date: "2026-10-16", weekday: "FRIDAY", count: 2, amount: 600_000, cumulativeReleased: 2_900_000, remainingHeld: 2_100_000, bySub: [] },
    { date: "2026-10-18", weekday: "SUNDAY", count: 1, amount: 400_000, cumulativeReleased: 3_300_000, remainingHeld: 1_700_000, bySub: [] },
  ],
  reconciles: true,
  ledgerHeld: 5_000_000,
  notes: [
    "Dự báo chỉ tính các khoản đang giữ tại thời điểm xem.",
    "Dự báo không tính khoản mới phát sinh từ giao dịch tương lai.",
    "Khoản tạm giữ có thể bị hủy nếu giao dịch gốc bị hoàn tiền, hoặc được giải phóng sớm hơn dự kiến.",
    "Đây là ước tính, không phải cam kết chi trả.",
  ],
  asOf: "2026-10-13T03:00:00Z",
  // Mục 14 (BE MR A): phần đã qua trong cửa sổ nhìn lùi cùng độ dài kỳ.
  pastFrom: "2026-09-14",
  releasedInPast: { count: 1, amount: 10_000 },
  cancelledByRefund: { count: 0, amount: 0 },
};

/** Một khoản của `GET /hold-calendar/{sub}/items` (record `HoldItem` của BE). */
export const holdItemFixture = {
  lineId: "22222222-2222-4222-8222-222222222222",
  itemId: "33333333-3333-4333-8333-333333333333",
  orderId: "44444444-4444-4444-8444-444444444444",
  orderCode: "HOLDTEST-1110161321",
  transactionCode: "FM26ABCDE",
  subMerchantId: subId,
  subMerchantCode: "MC000001-S001",
  subMerchantName: "Halo tech",
  terminalId: "55555555-5555-4555-8555-555555555555",
  terminalCode: "T0001",
  terminalType: "QR",
  terminalName: "Quầy 1",
  paidAt: "2026-10-10T09:13:00Z",
  heldAmount: 5_000,
  frozenAmount: 0,
  holdReleaseAt: "2026-10-15T17:00:00Z",
  state: "HOLDING",
  releasedAt: null,
  cancelledAt: null,
  eventAt: "2026-10-15T17:00:00Z",
  earlyReleaseId: null,
};

export const releasedItemFixture = {
  ...holdItemFixture,
  lineId: "66666666-6666-4666-8666-666666666666",
  orderCode: "DH261106-105016",
  transactionCode: null,
  heldAmount: 10_000,
  holdReleaseAt: "2026-10-11T17:00:00Z",
  state: "RELEASED",
  releasedAt: "2026-10-11T17:00:05Z",
  eventAt: "2026-10-11T17:00:05Z",
};
